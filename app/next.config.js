// next.config.js
/** @type {import('next').NextConfig} */

const repoEnv = process.env.GITHUB_REPOSITORY || ""; // e.g. username/repo
const [username, repo] = repoEnv.split("/");

module.exports = {
  output: "export",
  images: { unoptimized: true },
  basePath: repo ? `/${repo}` : "",
  assetPrefix: username && repo ? `https://${username}.github.io/${repo}` : "",
};
