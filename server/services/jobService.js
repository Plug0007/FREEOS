const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SKILL_KEYWORDS = [
  'React', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Python', 'Javascript', 
  'Typescript', 'AWS', 'Docker', 'Kubernetes', 'Tailwind', 'Next.js', 'Go', 
  'Vue', 'Angular', 'Java', 'C++', 'PHP', 'Ruby', 'Rust', 'GraphQL'
];

const normalizeJob = (job, source) => {
  const description = job.description || job.snippet || '';
  
  const skills = SKILL_KEYWORDS.filter(skill => 
    description.toLowerCase().includes(skill.toLowerCase()) ||
    (job.title && job.title.toLowerCase().includes(skill.toLowerCase()))
  );

  return {
    id: job.id || job.adref || Math.random().toString(36).substr(2, 9),
    title: job.title || 'Untitled Job',
    description: description,
    skills: skills.length > 0 ? skills : ['General'],
    budget: job.salary_min || 0,
    source: source,
    applyUrl: job.url || job.redirect_url || '#'
  };
};

const fetchRemotiveJobs = async () => {
  try {
    const response = await axios.get('https://remotive.com/api/remote-jobs?limit=10');
    return response.data.jobs.map(job => normalizeJob(job, 'Remotive'));
  } catch (error) {
    return [];
  }
};

const getFallbackJobs = () => {
  return [
    {
      id: 'mock-1',
      title: 'Senior React Developer',
      description: 'Looking for a React expert with experience in Tailwind and Node.js.',
      skills: ['React', 'Tailwind', 'Node.js'],
      budget: 5000,
      source: 'Internal',
      applyUrl: '#'
    }
  ];
};

const getAllJobs = async () => {
  let jobs = await fetchRemotiveJobs();
  if (jobs.length === 0) {
    jobs = getFallbackJobs();
  }
  return jobs;
};

module.exports = {
  getAllJobs
};
