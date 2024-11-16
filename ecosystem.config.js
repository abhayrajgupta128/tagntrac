module.exports = [
  {
    script: "dist/index.js",
    name: "Tag-N-Trac Platform API",
    exec_mode: "cluster",
    instances: "max",
    node_args: "--max-old-space-size=2048",
  },
];
