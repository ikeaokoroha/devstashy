// Temporary mock data for the dashboard UI. Replace with Prisma queries once the database is in place.

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  language?: string;
  isFavorite: boolean;
  isPinned: boolean;
  itemTypeId: string;
  collectionIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const currentUser: User = {
  id: 'user_1',
  name: 'John Doe',
  email: 'john@example.com',
  isPro: true,
};

export const itemTypes: ItemType[] = [
  {
    id: 'type_snippet',
    name: 'snippet',
    icon: 'Code',
    color: '#3b82f6',
    isSystem: true,
  },
  {
    id: 'type_prompt',
    name: 'prompt',
    icon: 'Sparkles',
    color: '#8b5cf6',
    isSystem: true,
  },
  {
    id: 'type_command',
    name: 'command',
    icon: 'Terminal',
    color: '#f97316',
    isSystem: true,
  },
  {
    id: 'type_note',
    name: 'note',
    icon: 'StickyNote',
    color: '#fde047',
    isSystem: true,
  },
  {
    id: 'type_file',
    name: 'file',
    icon: 'File',
    color: '#6b7280',
    isSystem: true,
  },
  {
    id: 'type_image',
    name: 'image',
    icon: 'Image',
    color: '#ec4899',
    isSystem: true,
  },
  {
    id: 'type_link',
    name: 'link',
    icon: 'Link',
    color: '#10b981',
    isSystem: true,
  },
];

export const collections: Collection[] = [
  {
    id: 'col_react_patterns',
    name: 'React Patterns',
    description: 'Common React patterns and hooks',
    isFavorite: true,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'col_python_snippets',
    name: 'Python Snippets',
    description: 'Useful Python code snippets',
    isFavorite: false,
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'col_context_files',
    name: 'Context Files',
    description: 'AI context files for projects',
    isFavorite: true,
    createdAt: new Date('2026-01-04'),
    updatedAt: new Date('2026-01-14'),
  },
  {
    id: 'col_interview_prep',
    name: 'Interview Prep',
    description: 'Technical interview preparation',
    isFavorite: false,
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-13'),
  },
  {
    id: 'col_git_commands',
    name: 'Git Commands',
    description: 'Frequently used git commands',
    isFavorite: true,
    createdAt: new Date('2026-01-06'),
    updatedAt: new Date('2026-01-11'),
  },
  {
    id: 'col_ai_prompts',
    name: 'AI Prompts',
    description: 'Curated AI prompts for coding',
    isFavorite: false,
    createdAt: new Date('2026-01-07'),
    updatedAt: new Date('2026-01-12'),
  },
];

export const items: Item[] = [
  // Snippets
  {
    id: 'item_use_auth',
    title: 'useAuth Hook',
    description: 'Custom authentication hook for React applications',
    content: `import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, isAuthenticated: !!user };
}`,
    language: 'typescript',
    isFavorite: true,
    isPinned: true,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_react_patterns', 'col_interview_prep'],
    tags: ['react', 'auth', 'hooks'],
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id: 'item_api_error_handling',
    title: 'API Error Handling Pattern',
    description: 'Fetch wrapper with exponential backoff retry logic',
    content: `export async function fetchWithRetry(url: string, retries = 3, delay = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Request failed: " + res.status);
      return await res.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, delay * 2 ** attempt));
    }
  }
}`,
    language: 'typescript',
    isFavorite: false,
    isPinned: true,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_react_patterns'],
    tags: ['fetch', 'error-handling', 'retry'],
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-01-12'),
  },
  {
    id: 'item_use_debounce',
    title: 'useDebounce Hook',
    description: 'Debounce a rapidly changing value',
    content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
    language: 'typescript',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_react_patterns'],
    tags: ['react', 'hooks'],
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: 'item_flatten_list',
    title: 'Flatten Nested List',
    description: 'Flatten a list of lists with a comprehension',
    content: `def flatten(nested: list[list]) -> list:
    return [item for sublist in nested for item in sublist]`,
    language: 'python',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_python_snippets'],
    tags: ['python', 'lists'],
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08'),
  },
  {
    id: 'item_read_json',
    title: 'Read JSON File',
    description: 'Load and parse a JSON file safely',
    content: `import json
from pathlib import Path

def read_json(path: str) -> dict:
    with Path(path).open(encoding="utf-8") as f:
        return json.load(f)`,
    language: 'python',
    isFavorite: true,
    isPinned: false,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_python_snippets'],
    tags: ['python', 'json', 'files'],
    createdAt: new Date('2026-01-07'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'item_binary_search',
    title: 'Binary Search',
    description: 'Classic iterative binary search',
    content: `def binary_search(arr: list[int], target: int) -> int:
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    language: 'python',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_interview_prep'],
    tags: ['algorithms', 'search'],
    createdAt: new Date('2026-01-06'),
    updatedAt: new Date('2026-01-06'),
  },
  {
    id: 'item_stream_completion',
    title: 'Streaming Chat Completion',
    description: 'Stream an OpenAI chat response token by token',
    content: `const stream = await openai.chat.completions.create({
  model: "gpt-5-nano",
  messages: [{ role: "user", content: prompt }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}`,
    language: 'typescript',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_snippet',
    collectionIds: ['col_ai_prompts'],
    tags: ['openai', 'streaming'],
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
  },

  // Prompts
  {
    id: 'item_code_review_prompt',
    title: 'Code Review Prompt',
    description: 'Thorough review focused on bugs and readability',
    content:
      'Review the following code. Point out bugs, security issues, and performance problems first, then suggest readability improvements. Be specific and reference line numbers.',
    isFavorite: true,
    isPinned: false,
    itemTypeId: 'type_prompt',
    collectionIds: ['col_ai_prompts'],
    tags: ['review', 'ai'],
    createdAt: new Date('2026-01-11'),
    updatedAt: new Date('2026-01-11'),
  },
  {
    id: 'item_refactor_prompt',
    title: 'Refactor for Clarity',
    description: 'Refactor code without changing behavior',
    content:
      'Refactor this code for clarity and maintainability. Do not change its behavior. Explain each change in one sentence.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_prompt',
    collectionIds: ['col_ai_prompts'],
    tags: ['refactor', 'ai'],
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'item_write_tests_prompt',
    title: 'Generate Unit Tests',
    description: 'Write tests covering edge cases',
    content:
      'Write unit tests for the following function. Cover the happy path, edge cases, and error handling. Use the existing test framework in the project.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_prompt',
    collectionIds: ['col_ai_prompts'],
    tags: ['testing', 'ai'],
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: 'item_mock_interviewer_prompt',
    title: 'Mock Interviewer',
    description: 'Practice technical interviews with AI',
    content:
      'Act as a senior engineer conducting a technical interview. Ask me one question at a time, wait for my answer, then give feedback before moving on.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_prompt',
    collectionIds: ['col_interview_prep'],
    tags: ['interview', 'ai'],
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08'),
  },

  // Commands
  {
    id: 'item_undo_commit',
    title: 'Undo Last Commit',
    description: 'Undo the last commit but keep the changes staged',
    content: 'git reset --soft HEAD~1',
    language: 'bash',
    isFavorite: true,
    isPinned: true,
    itemTypeId: 'type_command',
    collectionIds: ['col_git_commands'],
    tags: ['git'],
    createdAt: new Date('2026-01-11'),
    updatedAt: new Date('2026-01-11'),
  },
  {
    id: 'item_delete_merged_branches',
    title: 'Delete Merged Branches',
    description: 'Remove local branches already merged into main',
    content: 'git branch --merged main | grep -v main | xargs git branch -d',
    language: 'bash',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_command',
    collectionIds: ['col_git_commands'],
    tags: ['git', 'cleanup'],
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10'),
  },
  {
    id: 'item_stash_message',
    title: 'Stash With Message',
    description: 'Stash changes with a descriptive label',
    content: 'git stash push -m "work in progress"',
    language: 'bash',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_command',
    collectionIds: ['col_git_commands'],
    tags: ['git'],
    createdAt: new Date('2026-01-09'),
    updatedAt: new Date('2026-01-09'),
  },
  {
    id: 'item_kill_port',
    title: 'Kill Process on Port',
    description: 'Free up a port that is already in use',
    content: 'lsof -ti:3000 | xargs kill -9',
    language: 'bash',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_command',
    collectionIds: [],
    tags: ['terminal', 'ports'],
    createdAt: new Date('2026-01-14'),
    updatedAt: new Date('2026-01-14'),
  },

  // Notes
  {
    id: 'item_state_management_note',
    title: 'Context vs Zustand',
    description: 'When to reach for each state solution',
    content:
      'Use Context for low-frequency values like theme and auth. Use Zustand for frequently updated shared state to avoid re-rendering the whole tree.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_react_patterns'],
    tags: ['react', 'state'],
    createdAt: new Date('2026-01-08'),
    updatedAt: new Date('2026-01-08'),
  },
  {
    id: 'item_venv_note',
    title: 'Virtual Environment Setup',
    description: 'Steps for isolated Python environments',
    content:
      'python -m venv .venv, then activate with source .venv/bin/activate. Freeze dependencies with pip freeze > requirements.txt.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_python_snippets'],
    tags: ['python', 'setup'],
    createdAt: new Date('2026-01-04'),
    updatedAt: new Date('2026-01-04'),
  },
  {
    id: 'item_project_conventions_note',
    title: 'Project Conventions',
    description: 'Shared conventions to paste into AI context',
    content:
      'TypeScript strict mode. Server components by default. Tailwind v4 for styling. Validate all inputs with Zod.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_context_files'],
    tags: ['conventions', 'ai'],
    createdAt: new Date('2026-01-13'),
    updatedAt: new Date('2026-01-13'),
  },
  {
    id: 'item_big_o_note',
    title: 'Big-O Cheatsheet',
    description: 'Time complexity of common operations',
    content:
      'Array access O(1). Hash map lookup O(1) average. Binary search O(log n). Sorting O(n log n). Nested loops O(n^2).',
    isFavorite: true,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_interview_prep'],
    tags: ['algorithms', 'interview'],
    createdAt: new Date('2026-01-07'),
    updatedAt: new Date('2026-01-07'),
  },
  {
    id: 'item_system_design_note',
    title: 'System Design Checklist',
    description: 'Topics to cover in a system design round',
    content:
      'Clarify requirements, estimate scale, define the API, design the data model, then discuss caching, scaling, and failure modes.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_interview_prep'],
    tags: ['system-design', 'interview'],
    createdAt: new Date('2026-01-06'),
    updatedAt: new Date('2026-01-06'),
  },
  {
    id: 'item_star_note',
    title: 'Behavioral Questions (STAR)',
    description: 'Structure answers with Situation, Task, Action, Result',
    content:
      'Situation: set the context. Task: what you were responsible for. Action: what you did. Result: the measurable outcome.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_interview_prep'],
    tags: ['behavioral', 'interview'],
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-05'),
  },
  {
    id: 'item_branching_note',
    title: 'Branching Strategy',
    description: 'How we name and merge branches',
    content:
      'Create feature/[name] or fix/[name] from main. Merge back to main once the build passes, then delete the branch.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_git_commands'],
    tags: ['git', 'workflow'],
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03'),
  },
  {
    id: 'item_prompting_tips_note',
    title: 'Prompting Tips',
    description: 'Habits that get better AI output',
    content:
      'Give context first, state the goal clearly, show an example of the desired output, and ask for reasoning before the answer.',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_note',
    collectionIds: ['col_ai_prompts'],
    tags: ['ai', 'prompting'],
    createdAt: new Date('2026-01-04'),
    updatedAt: new Date('2026-01-04'),
  },

  // Files
  {
    id: 'item_claude_md',
    title: 'CLAUDE.md Template',
    description: 'Starter context file for AI coding assistants',
    fileUrl: 'https://example.com/files/CLAUDE.md',
    fileName: 'CLAUDE.md',
    fileSize: 2048,
    isFavorite: true,
    isPinned: false,
    itemTypeId: 'type_file',
    collectionIds: ['col_context_files'],
    tags: ['ai', 'context'],
    createdAt: new Date('2026-01-14'),
    updatedAt: new Date('2026-01-14'),
  },
  {
    id: 'item_coding_standards_file',
    title: 'Coding Standards',
    description: 'Team coding standards document',
    fileUrl: 'https://example.com/files/coding-standards.md',
    fileName: 'coding-standards.md',
    fileSize: 3584,
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_file',
    collectionIds: ['col_context_files'],
    tags: ['standards', 'context'],
    createdAt: new Date('2026-01-12'),
    updatedAt: new Date('2026-01-12'),
  },

  // Images
  {
    id: 'item_dashboard_wireframe',
    title: 'Dashboard Wireframe',
    description: 'Early wireframe of the dashboard layout',
    fileUrl: 'https://example.com/files/dashboard-wireframe.png',
    fileName: 'dashboard-wireframe.png',
    fileSize: 184320,
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_image',
    collectionIds: [],
    tags: ['design', 'ui'],
    createdAt: new Date('2026-01-13'),
    updatedAt: new Date('2026-01-13'),
  },

  // Links
  {
    id: 'item_react_docs',
    title: 'React Docs',
    description: 'Official React documentation',
    url: 'https://react.dev',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_link',
    collectionIds: ['col_react_patterns'],
    tags: ['react', 'docs'],
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
  {
    id: 'item_neetcode',
    title: 'NeetCode Roadmap',
    description: 'Structured list of interview problems',
    url: 'https://neetcode.io/roadmap',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_link',
    collectionIds: ['col_interview_prep'],
    tags: ['algorithms', 'interview'],
    createdAt: new Date('2026-01-03'),
    updatedAt: new Date('2026-01-03'),
  },
  {
    id: 'item_tailwind_docs',
    title: 'Tailwind CSS Docs',
    description: 'Tailwind CSS v4 documentation',
    url: 'https://tailwindcss.com/docs',
    isFavorite: false,
    isPinned: false,
    itemTypeId: 'type_link',
    collectionIds: [],
    tags: ['css', 'docs'],
    createdAt: new Date('2026-01-11'),
    updatedAt: new Date('2026-01-11'),
  },
];
