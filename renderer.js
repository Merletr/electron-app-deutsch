import { runReactionTestFromFiles } from './code/reaction_test_runner.js';

// For example, after user selects config and result file paths:
const configPath = './assets/config.json';
const resultPath = './results/results.csv';

runReactionTestFromFiles(configPath, resultPath)
  .then(() => console.log('Test finished!'))
  .catch(err => console.error(err));
