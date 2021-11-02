/* eslint-disable @typescript-eslint/no-explicit-any */
import mockConsole from 'jest-mock-console';
import { mockProcessExit } from 'jest-mock-process';
import simpleGit from 'simple-git/promise';
import strip from 'strip-ansi';

import { pruneMergedBranches } from './prune-merged-branches';

describe('Prune Merged Branches', () => {
  let mockExit;
  let restoreConsole;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExit = mockProcessExit();
    restoreConsole = mockConsole();
    (simpleGit as any).clearMocks();
  });

  afterEach(() => {
    mockExit.mockRestore();
    restoreConsole();
  });

  it('should print branches that are gone', async () => {
    await pruneMergedBranches();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(strip((console.log as jest.Mock).mock.calls[0][0]))
      .toMatchSnapshot();
  });

  it('should do nothing if no merged branches found', async () => {
    (simpleGit as any).branchReturnObj = {
      all: [ 'main' ],
      branches: {
        main: {
          current: false,
          name: 'main',
          commit: 'cd2ec48',
          label: '[origin/main: behind 16] ci(github): add pipelines'
        }
      },
      current: 'main',
      detached: false
    };
    await pruneMergedBranches();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(strip((console.log as jest.Mock).mock.calls[0][0]))
      .toMatchSnapshot();
  });

  it('should move to another branch if needed', async () => {
    // restoreConsole();
    (simpleGit as any).branchReturnObj = {
      all: [ 'main' ],
      branches: {
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
          label: '[origin/release/fix-release: gone] blah'
        }
      },
      current: 'release/fix-release',
      detached: false
    };
    await pruneMergedBranches();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(strip((console.log as jest.Mock).mock.calls[0][0]))
      .toMatchSnapshot();
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(strip((console.warn as jest.Mock).mock.calls[0][0]))
      .toMatchSnapshot();
  });
});
