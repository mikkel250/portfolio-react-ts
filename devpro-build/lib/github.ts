import { Repository } from "@/types/repos";
import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

const hasPAT = () => {
  if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN) {
    return true;
  }
  return false;
};

export const getUserRepositories = async (username: string) => {
  // get repositories of a user in decreasing order of stargazers

  if (hasPAT()) {
    try {
      const { data } = await octokit.rest.repos.listForUser({
        username,
        direction: "desc",
        per_page: 20,
        visibility: "public",
        public: true,
        sort: "updated",
        owner: username,
      });

      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  } else {
    try {
      const res = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=20&sort=updated`
      );
      const data = await res.json();

      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
};
