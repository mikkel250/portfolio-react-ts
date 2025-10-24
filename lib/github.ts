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
  // Hardcoded curated repositories for better performance and control
  const curatedRepos: Repository[] = [
    {
      id: 1,
      name: "react-ecommerce",
      full_name: "mikkel250/react-ecommerce",
      html_url: "https://github.com/mikkel250/react-ecommerce",
      description: "Mock online clothing store built with React and Redux on the front end, Node/Express for the backend, Firebase for the database and User Authentication, and Stripe for mock payments.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2024-01-15T00:00:00Z",
      created_at: "2023-06-01T00:00:00Z",
      topics: ["react", "redux", "nodejs", "firebase", "stripe", "ecommerce"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    // {
    //   id: 2,
    //   name: "optiride",
    //   full_name: "mikkel250/optiride",
    //   html_url: "https://github.com/mikkel250/optiride",
    //   description: "Integrated Google Maps API and React, TypeScript to combine biking and transit directions, gaining experience in API orchestration and asynchronous data handling.",
    //   stargazers_count: 0,
    //   forks_count: 0,
    //   language: "TypeScript",
    //   updated_at: "2024-01-10T00:00:00Z",
    //   created_at: "2023-05-01T00:00:00Z",
    //   topics: ["react", "typescript", "google-maps", "transit", "biking"],
    //   owner: {
    //     login: "mikkel250",
    //     avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
    //   }
    // },
    {
      id: 3,
      name: "SoftwareDevSmartContract",
      full_name: "mikkel250/SoftwareDevSmartContract",
      html_url: "https://github.com/mikkel250/SoftwareDevSmartContract",
      description: "Live demo showcasing smart contract integration and blockchain technology implementation with modern React frontend architecture.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2024-01-05T00:00:00Z",
      created_at: "2023-08-01T00:00:00Z",
      topics: ["react", "blockchain", "smart-contracts", "web3"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 4,
      name: "face-recognition",
      full_name: "mikkel250/face-recognition",
      html_url: "https://github.com/mikkel250/face-recognition",
      description: "Full-stack application enabling users to upload photos and perform real-time face recognition and detection. Built with React, Express, Node, PostgreSQL, and powered by the Clarifai API.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2023-12-20T00:00:00Z",
      created_at: "2023-03-01T00:00:00Z",
      topics: ["react", "nodejs", "postgresql", "clarifai", "face-recognition"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 5,
      name: "robofriends",
      full_name: "mikkel250/robofriends",
      html_url: "https://github.com/mikkel250/robofriends",
      description: "Simple React app that uses state to filter based on user input in the search field. Data is populated by pulling dummy data from two open source APIs - RoboHash and JSON placeholder.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2023-11-15T00:00:00Z",
      created_at: "2023-02-01T00:00:00Z",
      topics: ["react", "api", "filtering", "state-management"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 6,
      name: "calculator-project",
      full_name: "mikkel250/calculator-project",
      html_url: "https://github.com/mikkel250/calculator-project",
      description: "Calculator UI built entirely with HTML, CSS, and JavaScript featuring responsive design and interactive functionality.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2023-10-30T00:00:00Z",
      created_at: "2023-01-15T00:00:00Z",
      topics: ["html", "css", "javascript", "calculator", "ui"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 7,
      name: "bootstrap-store",
      full_name: "mikkel250/bootstrap-store",
      html_url: "https://github.com/mikkel250/bootstrap-store",
      description: "Demo online store built using Bootstrap 4 and vanilla JS featuring ceramics. Uses session storage for shopping cart functionality with add, edit, and delete capabilities.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2023-09-20T00:00:00Z",
      created_at: "2023-01-01T00:00:00Z",
      topics: ["bootstrap", "javascript", "ecommerce", "session-storage"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 8,
      name: "twilio_demos",
      full_name: "mikkel250/twilio_demos",
      html_url: "https://github.com/mikkel250/twilio_demos",
      description: "Project working with the Twilio API for creating, responding to, and receiving calls and SMS. Demonstrates integration with communication services and API orchestration.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2023-08-15T00:00:00Z",
      created_at: "2023-01-10T00:00:00Z",
      topics: ["twilio", "api", "sms", "communication", "nodejs"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 9,
      name: "react-graphql",
      full_name: "mikkel250/react-graphql",
      html_url: "https://github.com/mikkel250/react-graphql",
      description: "GraphQL implementation demo showcasing modern API integration with React frontend and GraphQL backend.",
      stargazers_count: 0,
      forks_count: 0,
      language: "JavaScript",
      updated_at: "2023-07-10T00:00:00Z",
      created_at: "2023-01-05T00:00:00Z",
      topics: ["react", "graphql", "api", "modern-web"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    },
    {
      id: 10,
      name: "portfolio-react-ts",
      full_name: "mikkel250/portfolio-react-ts",
      html_url: "https://github.com/mikkel250/portfolio-react-ts",
      description: "Professional portfolio website built with React, TypeScript, and modern web technologies. Features responsive design, interactive components, and showcases software engineering projects and experience.",
      stargazers_count: 0,
      forks_count: 0,
      language: "TypeScript",
      updated_at: "2024-01-20T00:00:00Z",
      created_at: "2023-12-01T00:00:00Z",
      topics: ["react", "typescript", "portfolio", "responsive", "modern-web"],
      owner: {
        login: "mikkel250",
        id: 12345678,
        node_id: "MDQ6VXNlcjEyMzQ1Njc4",
        avatar_url: "https://avatars.githubusercontent.com/u/your-avatar-url"
      }
    }
  ];

  return curatedRepos;

  // ORIGINAL API-BASED APPROACH (commented out for future use)
  // Uncomment the code below if you want to switch back to fetching from GitHub API
  
  // if (hasPAT()) {
  //   try {
  //     const { data } = await octokit.rest.repos.listForUser({
  //       username,
  //       direction: "desc",
  //       per_page: 20,
  //       visibility: "public",
  //       public: true,
  //       sort: "updated",
  //       owner: username,
  //     });

  //     return data;
  //   } catch (error) {
  //     console.log(error);
  //     return null;
  //   }
  // } else {
  //   try {
  //     const res = await fetch(
  //       `https://api.github.com/users/${username}/repos?per_page=20&sort=updated`
  //     );
  //     const data = await res.json();

  //     return data;
  //   } catch (error) {
  //     console.log(error);
  //     return null;
  //   }
  // }
};
