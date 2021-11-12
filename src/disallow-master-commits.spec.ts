/* eslint-disable @typescript-eslint/no-explicit-any */
import mockConsole from 'jest-mock-console';
import { mockProcessExit } from 'jest-mock-process';
import simpleGit from 'simple-git/promise';

import { disallowMainBranchesCommits } from './disallow-master-commits';

describe('Disallow Master Branch Commits', () => {
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

  it('should allow commits if on normal branch', async () => {
    await disallowMainBranchesCommits();
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  describe('should DISALLOW commits if on some main branch', () => {
    test.each([
      ['master'],
      ['main'],
      ['develop'],
      ['dev'],
      ['staging'],
      ['next'],
      ['beta'],
      ['alpha']
    ])(
      'main branch: %s',
      async (branchName) => {
        (simpleGit as any).branchReturnObj = mockMainBranch(branchName);
        await disallowMainBranchesCommits();
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(console.log).toHaveBeenCalledTimes(1);
        expect((console.log as jest.Mock).mock.calls[0][0])
          .toMatchSnapshot();
      }
    );
});
});

function mockMainBranch(name = 'main', isCurrent = true) {
  return {
    all: [ name ],
    branches: {
      main: {
        current: false,
        name: name,
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
    current: isCurrent ? name : 'release/fix-release',
    detached: false
  };
}
