"""LoRA curriculum + train orchestration for harness_daemon."""
from __future__ import annotations

import asyncio
import logging
import shutil
from pathlib import Path
from typing import Any

from curriculum_ingest import IngestConfig, build_records, write_jsonl
from grpo_runner import run_grpo_job
from lora_jobs import JobStore
from lora_paths import (
    resolve_artifacts_root,
    resolve_base_model_dir,
    resolve_curriculum_dirs,
    resolve_soul_path,
)
from lora_trainer import train_sft_lora

logger = logging.getLogger(__name__)


def collect_extra_jsonl(cfg: dict[str, Any], repo_root: Path) -> list[Path]:
    paths: list[Path] = []
    dirs = resolve_curriculum_dirs(cfg)
    for key in ("from_d", "so8t_data", "downloads_ghost"):
        p = dirs.get(key)
        if p is None:
            continue
        if p.is_file() and p.suffix == ".jsonl":
            paths.append(p)
        elif p.is_dir():
            for child in sorted(p.glob("*.jsonl")):
                paths.append(child)
    lora = cfg.get("lora") or {}
    for item in lora.get("extra_jsonl_globs") or []:
        # simple paths relative to repo or absolute
        raw = str(item).strip()
        if not raw:
            continue
        pp = Path(raw).expanduser()
        if not pp.is_absolute():
            pp = repo_root / pp
        if pp.is_file():
            paths.append(pp)
    return paths


async def run_build_curriculum(
    job_id: str,
    store: JobStore,
    cfg: dict[str, Any],
    repo_root: Path,
    arxiv_ids: list[str],
    include_soul: bool,
    extra_paths: list[str] | None,
) -> None:
    store.update(job_id, status="running", message="building curriculum")
    try:
        soul = resolve_soul_path(cfg, repo_root) if include_soul else None
        extras = collect_extra_jsonl(cfg, repo_root)
        if extra_paths:
            for e in extra_paths:
                p = Path(e).expanduser()
                if not p.is_absolute():
                    p = repo_root / p
                if p.exists():
                    extras.append(p)
        icfg = IngestConfig(
            arxiv_ids=arxiv_ids,
            soul_path=soul,
            extra_jsonl_paths=extras,
        )
        records = await asyncio.to_thread(build_records, icfg)
        out = resolve_artifacts_root(cfg) / "curriculum" / f"{job_id}.jsonl"
        n = await asyncio.to_thread(write_jsonl, records, out)
        latest = resolve_artifacts_root(cfg) / "curriculum" / "latest.jsonl"
        latest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(out, latest)
        store.update(
            job_id,
            status="completed",
            message=f"wrote {n} records",
            result={"output_path": str(out), "records": n, "latest": str(latest)},
        )
    except Exception as e:
        logger.exception("curriculum build failed")
        store.update(job_id, status="failed", error=str(e))


async def run_train_job(
    job_id: str,
    store: JobStore,
    cfg: dict[str, Any],
    dataset_path: Path | None,
    dry_run: bool,
) -> None:
    store.update(job_id, status="running", message="training")
    try:
        base = resolve_base_model_dir(cfg)
        if base is None or not base.exists():
            store.update(
                job_id,
                status="failed",
                error="base model dir not configured or missing (set HAKUA_BASE_MODEL_DIR)",
            )
            return
        art = resolve_artifacts_root(cfg)
        ds = dataset_path or (art / "curriculum" / "latest.jsonl")
        if not ds.exists():
            store.update(
                job_id,
                status="failed",
                error=f"dataset not found: {ds}",
            )
            return
        out = art / "train_runs" / job_id
        lora_cfg = cfg.get("lora") or {}
        sft_opts = lora_cfg.get("sft") if isinstance(lora_cfg.get("sft"), dict) else {}
        result = await asyncio.to_thread(
            train_sft_lora,
            base_model_dir=base,
            dataset_path=ds,
            output_dir=out,
            dry_run=dry_run,
            train_options=sft_opts,
        )
        if result.get("success"):
            store.update(
                job_id,
                status="completed",
                message="train finished",
                result=result,
            )
        else:
            store.update(
                job_id,
                status="failed",
                error=str(result.get("error")),
                result=result,
            )
    except Exception as e:
        logger.exception("train failed")
        store.update(job_id, status="failed", error=str(e))


async def run_grpo_job_async(
    job_id: str,
    store: JobStore,
    cfg: dict[str, Any],
    dataset_path: Path | None,
    mode: str,
) -> None:
    label = "grpo placeholder" if mode.strip().lower() == "placeholder" else "grpo train manifest"
    store.update(job_id, status="running", message=label)
    try:
        art = resolve_artifacts_root(cfg)
        ds = dataset_path or (art / "curriculum" / "latest.jsonl")
        if not ds.exists():
            store.update(
                job_id,
                status="failed",
                error=f"dataset not found: {ds}",
            )
            return
        out = art / "grpo_runs" / job_id
        report = await asyncio.to_thread(
            run_grpo_job,
            mode=mode,
            dataset_path=ds,
            output_dir=out,
            cfg=cfg,
            grpo_options=None,
            ref_model_name=None,
        )
        store.update(
            job_id,
            status="completed",
            message=f"grpo {mode} finished",
            result=report,
        )
    except Exception as e:
        store.update(job_id, status="failed", error=str(e))
