import simpleGit from 'simple-git/promise';

const git = simpleGit();

(async () => {
  try {
    const branchSummaryResult = await git.branch(['-vv']);
    const mainBranch =
      branchSummaryResult.branches.master || branchSummaryResult.branches.main;

    if (mainBranch.current === true) {
      console.info('Should not commit directly to master when working locally');
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
