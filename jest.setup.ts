import inquirer from 'inquirer';
import simpleGit from 'simple-git/promise';

jest.mock('inquirer', () => ({
    prompt: jest.fn().mockReturnValue(Promise.resolve({
      whatToDo: 'prune all gone branches'
    }))
}));

jest.mock('simple-git/promise', () => {
  const DEFAULT_RETURN = {
    all: [
      'beta',
      'feature/improve-things',
      'fix-release-files',
      'main',
      'release/fix-release',
      'release/new-main-release'
    ],
    branches: {
      beta: {
        current: false,
        name: 'beta',
        commit: '3eaa4c1',
        label: '[origin/beta: behind 2] fix(release): add lib files'
      },
      'feature/improve-things': {
        current: true,
        name: 'feature/improve-things',
        commit: '94337fd',
        label: 'chore(release): 1.0.0-beta.2 [skip ci]'
      },
      'fix-release-files': {
        current: false,
        name: 'fix-release-files',
        commit: '3eaa4c1',
        label: 'fix(release): add lib files'
      },
      main: {
        current: false,
        name: 'main',
        commit: 'cd2ec48',
        label: '[origin/main: behind 16] ci(github): add pipelines'
      },
      'release/fix-release': {
        current: false,
        name: 'release/fix-release',
        commit: '8f64df7',
        label: '[origin/release/fix-release: gone] message'
      },
      'release/new-main-release': {
        current: false,
        name: 'release/new-main-release',
        commit: 'a71bc34',
        label: '[origin/release/new-main-release: gone] message'
      }
    },
    current: 'feature/improve-things',
    detached: false
  };
  const simplePromiseBranchMock = jest.fn()
    .mockImplementation(() => {
      return Promise.resolve(simplePromise.branchReturnObj);
    });
  const simplePromise = () => ({
    branch: simplePromiseBranchMock,
    fetch: () => jest.fn().mockImplementation(() => console.log('fetched!'))    
  });
  simplePromise.branchReturnObj = DEFAULT_RETURN;
  simplePromise.clearMocks = () => {
    simplePromise.branchReturnObj = DEFAULT_RETURN;
    simplePromiseBranchMock.mockClear();
  };

  return simplePromise;
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const simpleGitMock = simpleGit;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inquirerMock = inquirer;
