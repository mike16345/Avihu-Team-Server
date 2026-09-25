export default {
  repository: "Avihu Team Server",
  outputDir: ".test-report",
  workflowPath: ".github/workflows/server-tests.yml",
  email: {
    from: "Avihu CI <michaelgani815@gmail.com>",
    to: "michaelgani815@gmail.com",
  },
  suites: [
    {
      name: "Server tests",
      framework: "jest",
      cwd: "server",
      command: "npx",
      args: ["jest", "--runInBand"],
    },
  ],
};
