---
name: deep-research-specialist
description: Autonomous deep research specialist for Codex. This skill should be used when users need Codex to autonomously explore documentation, discover best practices, conduct technical research, or build knowledge bases. Use for API documentation discovery, framework research, technology comparisons, implementation patterns, and comprehensive knowledge gathering.
---

# Deep Research Specialist

This skill transforms Codex into an autonomous research specialist capable of independently exploring documentation, discovering best practices, and building comprehensive knowledge bases. It leverages multiple search backends and research strategies to provide thorough, well-sourced information.

## Core Features

### Autonomous Documentation Discovery

- **API Documentation**: Automatically find and analyze API documentation
- **Framework Guides**: Research framework-specific best practices and patterns
- **Library References**: Discover library documentation and usage examples
- **Platform Documentation**: Explore cloud platforms, databases, and infrastructure docs

### Best Practices Research

- **Implementation Patterns**: Identify proven design patterns and architectures
- **Performance Optimization**: Research optimization techniques and benchmarks
- **Security Best Practices**: Discover security guidelines and compliance standards
- **Code Quality Standards**: Find coding standards and quality guidelines

### Technical Research Capabilities

- **Technology Comparisons**: Compare frameworks, libraries, and tools
- **Architecture Research**: Explore system architectures and design decisions
- **Performance Analysis**: Research performance characteristics and bottlenecks
- **Scalability Patterns**: Discover scaling strategies and distributed systems patterns

### Knowledge Base Construction

- **Comprehensive Coverage**: Build complete knowledge bases on topics
- **Source Validation**: Cross-reference multiple sources for accuracy
- **Citation Management**: Track sources and maintain reference integrity
- **Knowledge Synthesis**: Synthesize information from diverse sources

## Research Strategies

### Multi-Backend Search

- **Gemini Search**: Google's AI-powered search for comprehensive results
- **DuckDuckGo**: Privacy-focused search with broad coverage
- **Google Search**: Traditional web search for established content
- **Bing Search**: Microsoft's search engine for diverse perspectives

### Intelligent Research Planning

- **Query Decomposition**: Break complex research questions into focused sub-queries
- **Source Prioritization**: Rank sources by relevance, recency, and authority
- **Depth Control**: Adjust research depth from overview to exhaustive analysis
- **Breadth Management**: Control the scope of research across related topics

### Quality Assurance

- **Source Credibility**: Evaluate source reliability and expertise
- **Information Freshness**: Prioritize recent and up-to-date information
- **Cross-Validation**: Verify information across multiple independent sources
- **Bias Detection**: Identify and mitigate potential biases in research

## Usage Examples

### API Documentation Research

```bash
# Research React hooks documentation and best practices
python scripts/llmops_manager.py skill-mcp execute-skill \
  --id deep-research-specialist \
  --input '{"operation": "api_research", "topic": "React Hooks", "depth": 4, "focus": "best_practices"}'
```

### Framework Comparison

```bash
# Compare different state management libraries
python scripts/llmops_manager.py skill-mcp execute-skill \
  --id deep-research-specialist \
  --input '{"operation": "comparison", "topic": "React State Management", "options": ["Redux", "Zustand", "Recoil", "Context API"], "criteria": ["performance", "complexity", "ecosystem"]}'
```

### Best Practices Discovery

```bash
# Find security best practices for web applications
python scripts/llmops_manager.py skill-mcp execute-skill \
  --id deep-research-specialist \
  --input '{"operation": "best_practices", "domain": "web_security", "focus": "authentication", "depth": 3}'
```

### Technology Research

```bash
# Research emerging AI frameworks
python scripts/llmops_manager.py skill-mcp execute-skill \
  --id deep-research-specialist \
  --input '{"operation": "technology_research", "topic": "AI Frameworks 2024", "backends": ["gemini", "google"], "citations": true}'
```

## Research Methodologies

### Systematic Literature Review

- **Comprehensive Coverage**: Exhaustive search across all relevant sources
- **Inclusion/Exclusion Criteria**: Well-defined selection criteria
- **Quality Assessment**: Rigorous evaluation of source quality
- **Synthesis**: Structured synthesis of findings

### Rapid Evidence Assessment

- **Focused Research**: Targeted investigation of specific questions
- **Time-Bounded**: Efficient research within time constraints
- **Practical Focus**: Emphasis on actionable insights
- **Iterative Refinement**: Progressive refinement of research scope

### Exploratory Research

- **Discovery-Oriented**: Open-ended exploration of topics
- **Pattern Identification**: Uncover trends and emerging patterns
- **Hypothesis Generation**: Develop research questions and hypotheses
- **Knowledge Mapping**: Create visual knowledge landscapes

## Integration with Codex Ecosystem

This skill integrates deeply with other Codex capabilities:

- **LLMOps Integration**: Optimize research queries for cost and performance
- **A2A Communication**: Collaborate with other research agents
- **Autonomous Orchestration**: Coordinate multi-step research workflows
- **Skill/MCP Integration**: Leverage external tools and APIs for research
- **Plan Mode**: Create structured research plans and execution strategies

## Advanced Features

### Intelligent Research Assistants

- **Context Awareness**: Understand research context and user expertise
- **Adaptive Strategies**: Adjust research approach based on topic complexity
- **Learning Systems**: Improve research quality through experience
- **Personalization**: Customize research style and depth per user

### Multi-Modal Research

- **Text Analysis**: Deep analysis of textual content and documentation
- **Code Examples**: Extract and analyze code samples from repositories
- **Visual Content**: Research diagrams, charts, and visual documentation
- **Video Content**: Analyze tutorials, presentations, and recorded content

### Research Automation

- **Scheduled Research**: Automated periodic research updates
- **Alert Systems**: Notifications for new developments in tracked topics
- **Knowledge Updates**: Continuous updating of knowledge bases
- **Trend Analysis**: Identify emerging trends and technologies

### Collaboration Features

- **Research Teams**: Coordinate multiple agents on complex research
- **Knowledge Sharing**: Share research findings across Codex instances
- **Peer Review**: Automated quality assessment of research outputs
- **Version Control**: Track evolution of research findings over time

## Best Practices for Research

### Research Planning

- **Clear Objectives**: Define specific research goals and success criteria
- **Scope Definition**: Establish clear boundaries for research scope
- **Resource Assessment**: Evaluate available time, tools, and access
- **Methodology Selection**: Choose appropriate research strategies

### Source Evaluation

- **Authority Assessment**: Evaluate source credibility and expertise
- **Currency Check**: Verify information timeliness and relevance
- **Bias Analysis**: Identify potential biases and conflicting viewpoints
- **Cross-Validation**: Verify information across multiple sources

### Information Synthesis

- **Pattern Recognition**: Identify common themes and patterns
- **Gap Analysis**: Identify areas needing further research
- **Critical Analysis**: Evaluate strengths and weaknesses of findings
- **Actionable Insights**: Focus on practical implications and applications

### Quality Assurance

- **Methodological Rigor**: Maintain consistent research standards
- **Documentation**: Comprehensive documentation of research process
- **Peer Validation**: Seek validation from domain experts when possible
- **Continuous Improvement**: Learn from research outcomes and improve methods
