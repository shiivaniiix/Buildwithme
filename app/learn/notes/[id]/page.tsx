"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface NoteContent {
  id: string;
  title: string;
  level: string;
  category: string;
  icon?: string;
  sections: Array<{
    title: string;
    content: string;
    code?: string;
  }>;
  resources: Array<{
    label: string;
    url: string;
  }>;
}

// Note content - placeholder with beginner-friendly explanations
const notesContent: Record<string, NoteContent> = {
  "html-css": {
    id: "html-css",
    title: "HTML & CSS",
    level: "Beginner",
    category: "Web / Programming",
    icon: "🌐",
    sections: [
      {
        title: "What is HTML?",
        content: "HTML (HyperText Markup Language) is the standard language for creating web pages. It defines the structure and content of a webpage using elements and tags."
      },
      {
        title: "Basic HTML Structure",
        content: "Every HTML document needs a basic structure:",
        code: `<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a paragraph.</p>
</body>
</html>`
      },
      {
        title: "What is CSS?",
        content: "CSS (Cascading Style Sheets) is used to style and layout web pages. It controls colors, fonts, spacing, and positioning."
      },
      {
        title: "Common CSS Properties",
        content: "Key CSS properties include: color, background-color, margin, padding, font-size, width, height, display, and flexbox."
      },
      {
        title: "Example Code",
        content: "Here's a simple example combining HTML and CSS:",
        code: `<!-- HTML -->
<div class="container">
  <h1>Welcome</h1>
</div>

/* CSS */
.container {
  background-color: #f0f0f0;
  padding: 20px;
  text-align: center;
}`
      }
    ],
    resources: [
      { label: "MDN HTML", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
      { label: "MDN CSS", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" }
    ]
  },
  javascript: {
    id: "javascript",
    title: "JavaScript",
    level: "Beginner",
    category: "Web / Programming",
    icon: "📜",
    sections: [
      {
        title: "What is JavaScript?",
        content: "JavaScript is a programming language that makes web pages interactive. It runs in the browser and can manipulate HTML and CSS."
      },
      {
        title: "Variables & Data Types",
        content: "JavaScript uses variables to store data. Common data types include: strings, numbers, booleans, arrays, and objects.",
        code: `let name = "John";        // String
let age = 25;            // Number
let isStudent = true;    // Boolean
let hobbies = ["coding", "reading"];  // Array
let person = { name: "John", age: 25 };  // Object`
      },
      {
        title: "Functions",
        content: "Functions are reusable blocks of code that perform specific tasks.",
        code: `function greet(name) {
  return "Hello, " + name;
}

// Arrow function (modern syntax)
const greet = (name) => {
  return "Hello, " + name;
};`
      },
      {
        title: "Loops & Conditions",
        content: "Control flow helps you make decisions and repeat actions.",
        code: `// If statement
if (age >= 18) {
  console.log("Adult");
}

// For loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// Array forEach
hobbies.forEach(hobby => {
  console.log(hobby);
});`
      },
      {
        title: "Common Mistakes",
        content: "• Forgetting semicolons (optional but recommended)\n• Using == instead of === (strict equality)\n• Not understanding scope (let vs var)\n• Forgetting to handle async operations"
      }
    ],
    resources: [
      { label: "MDN JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
      { label: "JavaScript.info", url: "https://javascript.info" }
    ]
  },
  react: {
    id: "react",
    title: "React",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "⚛️",
    sections: [
      {
        title: "What is React?",
        content: "React is a JavaScript library for building user interfaces. It uses components to create reusable UI pieces."
      },
      {
        title: "Components",
        content: "Components are the building blocks of React applications.",
        code: `function Welcome() {
  return <h1>Hello, World!</h1>;
}

// Using JSX
function App() {
  return (
    <div>
      <Welcome />
    </div>
  );
}`
      },
      {
        title: "State & Props",
        content: "State manages component data, props pass data between components.",
        code: `function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`
      },
      {
        title: "Hooks",
        content: "Hooks let you use state and other React features in functional components. Common hooks: useState, useEffect, useContext."
      }
    ],
    resources: [
      { label: "React Docs", url: "https://react.dev" },
      { label: "React Tutorial", url: "https://react.dev/learn" }
    ]
  },
  typescript: {
    id: "typescript",
    title: "TypeScript",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "📘",
    sections: [
      {
        title: "What is TypeScript?",
        content: "TypeScript is JavaScript with type checking. It helps catch errors before runtime and makes code more maintainable."
      },
      {
        title: "Basic Types",
        content: "TypeScript adds types to JavaScript variables.",
        code: `let name: string = "John";
let age: number = 25;
let isActive: boolean = true;
let items: string[] = ["a", "b", "c"];`
      },
      {
        title: "Functions with Types",
        content: "Functions can specify parameter and return types.",
        code: `function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const greet = (name: string): string => {
  return "Hello, " + name;
};`
      },
      {
        title: "Interfaces",
        content: "Interfaces define the shape of objects.",
        code: `interface Person {
  name: string;
  age: number;
  email?: string;  // Optional property
}

const person: Person = {
  name: "John",
  age: 25
};`
      }
    ],
    resources: [
      { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" }
    ]
  },
  nodejs: {
    id: "nodejs",
    title: "Node.js",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "🟢",
    sections: [
      {
        title: "What is Node.js?",
        content: "Node.js is JavaScript runtime that lets you run JavaScript on the server. It's built on Chrome's V8 engine."
      },
      {
        title: "Creating a Server",
        content: "Node.js can create web servers easily.",
        code: `const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World');
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});`
      },
      {
        title: "Modules",
        content: "Node.js uses modules to organize code. Use require() to import and module.exports to export."
      },
      {
        title: "npm",
        content: "npm (Node Package Manager) is used to install and manage packages. Common commands: npm install, npm start, npm run build."
      }
    ],
    resources: [
      { label: "Node.js Docs", url: "https://nodejs.org/docs" }
    ]
  },
  python: {
    id: "python",
    title: "Python",
    level: "Beginner",
    category: "Web / Programming",
    icon: "🐍",
    sections: [
      {
        title: "What is Python?",
        content: "Python is a high-level, interpreted programming language known for its simplicity and readability. Great for beginners!"
      },
      {
        title: "Variables & Data Types",
        content: "Python variables don't need type declarations.",
        code: `name = "John"           # String
age = 25              # Integer
price = 19.99         # Float
is_student = True     # Boolean
hobbies = ["coding", "reading"]  # List`
      },
      {
        title: "Functions",
        content: "Functions in Python are defined with def.",
        code: `def greet(name):
    return f"Hello, {name}!"

# Call the function
message = greet("John")
print(message)  # Output: Hello, John!`
      },
      {
        title: "Loops & Conditions",
        content: "Python uses indentation for code blocks.",
        code: `# If statement
if age >= 18:
    print("Adult")
else:
    print("Minor")

# For loop
for i in range(5):
    print(i)

# List iteration
for hobby in hobbies:
    print(hobby)`
      },
      {
        title: "Common Mistakes",
        content: "• Forgetting colons after if/for/def\n• Incorrect indentation\n• Using = instead of == for comparison\n• Not handling exceptions"
      }
    ],
    resources: [
      { label: "Python Docs", url: "https://docs.python.org/3/" },
      { label: "Real Python", url: "https://realpython.com" }
    ]
  },
  "django-flask": {
    id: "django-flask",
    title: "Django / Flask",
    level: "Intermediate",
    category: "Web / Programming",
    icon: "🐍",
    sections: [
      {
        title: "What are Django and Flask?",
        content: "Django and Flask are Python web frameworks. Django is full-featured, Flask is lightweight and flexible."
      },
      {
        title: "Flask Basics",
        content: "Flask is simple and easy to get started.",
        code: `from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)`
      },
      {
        title: "Django Basics",
        content: "Django follows the MVT (Model-View-Template) pattern and includes many built-in features like admin panel, authentication, and ORM."
      },
      {
        title: "When to Use Which?",
        content: "Use Flask for: small projects, APIs, learning. Use Django for: large projects, rapid development, built-in features needed."
      }
    ],
    resources: [
      { label: "Flask Docs", url: "https://flask.palletsprojects.com" },
      { label: "Django Docs", url: "https://docs.djangoproject.com" }
    ]
  },
  sql: {
    id: "sql",
    title: "SQL",
    level: "Beginner",
    category: "Data / AI",
    icon: "🗄️",
    sections: [
      {
        title: "What is SQL?",
        content: "SQL (Structured Query Language) is used to manage and query relational databases. It's essential for working with data."
      },
      {
        title: "Basic Queries",
        content: "SELECT is used to retrieve data from tables.",
        code: `-- Select all columns
SELECT * FROM users;

-- Select specific columns
SELECT name, email FROM users;

-- Filter with WHERE
SELECT * FROM users WHERE age > 18;`
      },
      {
        title: "Common Operations",
        content: "INSERT, UPDATE, DELETE for modifying data.",
        code: `-- Insert data
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');

-- Update data
UPDATE users SET age = 26 WHERE name = 'John';

-- Delete data
DELETE FROM users WHERE age < 18;`
      },
      {
        title: "JOINs",
        content: "JOINs combine data from multiple tables.",
        code: `SELECT users.name, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id;`
      }
    ],
    resources: [
      { label: "SQL Tutorial", url: "https://www.w3schools.com/sql/" }
    ]
  },
  "data-science-basics": {
    id: "data-science-basics",
    title: "Data Science Basics",
    level: "Beginner",
    category: "Data / AI",
    icon: "📊",
    sections: [
      {
        title: "What is Data Science?",
        content: "Data Science combines statistics, programming, and domain expertise to extract insights from data."
      },
      {
        title: "Key Libraries",
        content: "Python libraries for data science: pandas (data manipulation), numpy (numerical computing), matplotlib/seaborn (visualization)."
      },
      {
        title: "Data Workflow",
        content: "1. Data Collection\n2. Data Cleaning\n3. Exploratory Data Analysis (EDA)\n4. Feature Engineering\n5. Modeling\n6. Evaluation\n7. Deployment"
      },
      {
        title: "Example with Pandas",
        content: "Basic data manipulation:",
        code: `import pandas as pd

# Load data
df = pd.read_csv('data.csv')

# View data
print(df.head())

# Basic statistics
print(df.describe())

# Filter data
filtered = df[df['age'] > 25]`
      }
    ],
    resources: [
      { label: "Pandas Docs", url: "https://pandas.pydata.org/docs/" }
    ]
  },
  "ml-basics": {
    id: "ml-basics",
    title: "Machine Learning Basics",
    level: "Intermediate",
    category: "Data / AI",
    icon: "🤖",
    sections: [
      {
        title: "What is Machine Learning?",
        content: "Machine Learning is a subset of AI where computers learn from data without being explicitly programmed."
      },
      {
        title: "Types of ML",
        content: "• Supervised Learning: Learn from labeled data (classification, regression)\n• Unsupervised Learning: Find patterns in unlabeled data (clustering)\n• Reinforcement Learning: Learn through trial and error"
      },
      {
        title: "Common Algorithms",
        content: "• Linear Regression\n• Decision Trees\n• Random Forest\n• Neural Networks\n• K-Means Clustering"
      },
      {
        title: "Example with scikit-learn",
        content: "Simple ML example:",
        code: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)`
      }
    ],
    resources: [
      { label: "scikit-learn", url: "https://scikit-learn.org" }
    ]
  },
  "git-github": {
    id: "git-github",
    title: "Git & GitHub",
    level: "Beginner",
    category: "DevOps / Systems",
    icon: "📦",
    sections: [
      {
        title: "What is Git?",
        content: "Git is a version control system that tracks changes in your code. It helps you collaborate and manage project history."
      },
      {
        title: "Basic Commands",
        content: "Essential Git commands every developer should know.",
        code: `# Initialize repository
git init

# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your message"

# Push to remote
git push origin main

# Pull changes
git pull origin main`
      },
      {
        title: "GitHub",
        content: "GitHub is a platform for hosting Git repositories. It provides collaboration features like pull requests, issues, and code reviews."
      },
      {
        title: "Common Workflow",
        content: "1. Create a branch\n2. Make changes\n3. Commit changes\n4. Push to GitHub\n5. Create Pull Request\n6. Merge after review"
      }
    ],
    resources: [
      { label: "Git Docs", url: "https://git-scm.com/doc" },
      { label: "GitHub Guides", url: "https://guides.github.com" }
    ]
  },
  "linux-basics": {
    id: "linux-basics",
    title: "Linux Basics",
    level: "Beginner",
    category: "DevOps / Systems",
    icon: "🐧",
    sections: [
      {
        title: "What is Linux?",
        content: "Linux is an open-source operating system. It's widely used in servers, development environments, and cloud computing."
      },
      {
        title: "Essential Commands",
        content: "Basic Linux commands for navigation and file management.",
        code: `# List files
ls

# Change directory
cd /path/to/directory

# Print working directory
pwd

# Create directory
mkdir new_folder

# Remove file
rm filename

# View file content
cat filename

# Search in files
grep "pattern" filename`
      },
      {
        title: "File Permissions",
        content: "Linux uses permissions (read, write, execute) for files and directories. Use chmod to change permissions."
      },
      {
        title: "Package Managers",
        content: "Different Linux distributions use different package managers: apt (Debian/Ubuntu), yum (RedHat), pacman (Arch)."
      }
    ],
    resources: [
      { label: "Linux Command Line", url: "https://linuxcommand.org" }
    ]
  },
  "docker-basics": {
    id: "docker-basics",
    title: "Docker Basics",
    level: "Intermediate",
    category: "DevOps / Systems",
    icon: "🐳",
    sections: [
      {
        title: "What is Docker?",
        content: "Docker is a platform for containerizing applications. Containers package apps with their dependencies for consistent deployment."
      },
      {
        title: "Dockerfile",
        content: "A Dockerfile defines how to build a Docker image.",
        code: `FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]`
      },
      {
        title: "Basic Commands",
        content: "Essential Docker commands.",
        code: `# Build image
docker build -t myapp .

# Run container
docker run -p 3000:3000 myapp

# List containers
docker ps

# Stop container
docker stop container_id

# View logs
docker logs container_id`
      },
      {
        title: "Docker Compose",
        content: "Docker Compose manages multi-container applications. Define services in docker-compose.yml file."
      }
    ],
    resources: [
      { label: "Docker Docs", url: "https://docs.docker.com" }
    ]
  }
};

export default function NotePage({
  params,
}: {
  params: { id: string };
}) {
  const note = notesContent[params.id];
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!note) {
    return (
      <main className="min-h-screen code-pattern relative">
        <Navbar />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Note Not Found</h1>
            <p className="text-gray-400 mb-6">The note "{params.id}" does not exist.</p>
            <Link
              href="/learn"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              ← Back to Learn
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Learn</span>
          </Link>
          
          <div className="flex items-start gap-4 mb-4">
            {note.icon && (
              <div className="text-5xl flex-shrink-0">{note.icon}</div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {note.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
                  {note.level}
                </span>
                <span className="text-gray-400 text-sm">{note.category}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Note Sections */}
        <div className="glass-strong rounded-2xl p-8 shadow-soft-xl mb-8">
          <h2 className="text-2xl font-bold mb-6 text-white">Content</h2>
          
          <div className="space-y-4">
            {note.sections.map((section, index) => {
              const isExpanded = expandedSections.has(section.title);
              
              return (
                <div
                  key={index}
                  className="glass rounded-xl border border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-700">
                      <p className="text-gray-300 leading-relaxed mt-4 whitespace-pre-line">
                        {section.content}
                      </p>
                      {section.code && (
                        <pre className="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto border border-gray-700">
                          <code className="text-sm text-gray-200 font-mono">{section.code}</code>
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resources */}
        {note.resources.length > 0 && (
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            <h2 className="text-2xl font-bold mb-4 text-white">Resources</h2>
            <div className="space-y-2">
              {note.resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block glass rounded-lg p-4 border border-gray-700 hover:border-cyan-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-medium">{resource.label}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}





