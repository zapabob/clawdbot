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

console.log('ClawBook AGI System Starting...');

agi.on('started', () => console.log('AGI System Started'));
agi.on('generation', (stats) => console.log(`Generation ${stats.generation}: Best=${stats.bestFitness.toFixed(4)}, Avg=${stats.avgFitness.toFixed(4)}, Diversity=${stats.diversity.toFixed(4)}`));
agi.on('terminated', (data) => console.log('Evolution Terminated:', data.reason));
agi.on('knowledge_stored', ({ knowledge }) => console.log('Knowledge stored:', knowledge.type));
agi.on('emergent_insight', (insight) => console.log('Emergent Insight:', insight.description));

agi.start();

const sampleTask = {
  id: 'task-1',
  type: 'optimization',
  input: { parameters: Array.from({length: 10}, () => Math.random()) },
  targetFitness: 0.95,
  constraints: [],
};

setTimeout(async () => {
  await agi.learn(sampleTask);
  console.log('\nKnowledge Base:', agi.getKnowledgeBase().length, 'items');
  console.log('Insights:', agi.getInsights().length);
  console.log('\nFinal Stats:', JSON.stringify(agi.getStats(), null, 2));
  agi.stop();
  process.exit(0);
}, 5000);

setTimeout(() => {
  console.log('\nFinal Stats:', JSON.stringify(agi.getStats(), null, 2));
  agi.stop();
  process.exit(0);
}, 120000);
