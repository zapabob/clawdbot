import ClawBookAGI from './clawbook-agi.js';

const agi = new ClawBookAGI({
  evolution: {
    populationSize: 50,
    maxGenerations: 100,
    fitnessThreshold: 0.95,
  },
  collective: {
    agentCount: 10,
    quorumSize: 5,
    consensusThreshold: 0.7,
  },
  healing: {
    checkInterval: 30000,
    autoRecovery: true,
  },
});

console.log('========================================');
console.log('ClawBook Collective AGI System');
console.log('========================================');

let taskId = 0;

agi.on('started', () => console.log('[SYSTEM] AGI System Started'));
agi.on('generation', (stats) => console.log(`[EVOLUTION] Gen ${stats.generation}: Best=${stats.bestFitness.toFixed(4)}, Avg=${stats.avgFitness.toFixed(4)}, Diversity=${stats.diversity.toFixed(4)}`));
agi.on('terminated', (data) => console.log('[EVOLUTION] Terminated:', data.reason));
agi.on('knowledge_stored', ({ knowledge }) => console.log('[KNOWLEDGE] Stored:', knowledge.type, 'fitness=', knowledge.fitness.toFixed(4)));
agi.on('emergent_insight', (insight) => console.log('[INSIGHT]', insight.description));
agi.on('task_started', (task) => console.log('[TASK] Started:', task.type, task.id));
agi.on('task_completed', (task) => console.log('[TASK] Completed:', task.type, 'fitness=', task.fitness?.toFixed(4)));
agi.on('healing_required', (anomaly) => console.log('[HEALING] Anomaly detected:', anomaly.type));
agi.on('system_recovered', (data) => console.log('[HEALING] Recovery success:', data.action));
agi.on('collective_knowledge_integrated', ({ consensus }) => console.log('[COLLECTIVE] Consensus reached, confidence=', consensus.confidence.toFixed(4)));

agi.start();

async function runContinuousTasks() {
  while (true) {
    taskId++;
    const task = {
      id: `task-${taskId}`,
      type: taskId % 3 === 0 ? 'knowledge_generation' : (taskId % 2 === 0 ? 'problem_solving' : 'optimization'),
      input: { parameters: Array.from({length: 10}, () => Math.random()) },
      targetFitness: 0.95,
      constraints: [],
    };

    try {
      await agi.learn(task);
    } catch (error) {
      console.error('[ERROR]', error.message);
    }

    const stats = agi.getStats();
    console.log('\n[STATUS] Generation:', stats.generation, '| Knowledge:', stats.knowledgeCount, '| Insights:', stats.insightCount);

    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

runContinuousTasks().catch(console.error);

console.log('[SYSTEM] Running continuous tasks...');
