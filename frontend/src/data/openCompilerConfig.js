// Multi-Language Configurations & Runnable Starter Templates for Open Compiler
export const OPEN_COMPILER_LANGUAGES = {
  python: {
    id: 'python',
    label: 'Python 3.12',
    icon: 'fa-brands fa-python',
    color: '#38bdf8',
    prismLang: 'python',
    tabSpaces: '    ',
    defaultCode: `# Python 3.12 Playground
import sys

def main():
    print("Hello from Python 3.12!")
    lines = sys.stdin.read().strip()
    if lines:
        print(f"Standard Input Received:\\n{lines}")

if __name__ == "__main__":
    main()
`
  },
  cpp: {
    id: 'cpp',
    label: 'C++ 20 (g++)',
    icon: 'fa-solid fa-code',
    color: '#f59e0b',
    prismLang: 'cpp',
    tabSpaces: '    ',
    defaultCode: `// C++ 20 (g++ 14) Playground
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    cout << "Hello from C++ 20!" << endl;
    string input;
    if (getline(cin, input)) {
        cout << "Standard Input: " << input << endl;
    }
    return 0;
}
`
  },
  java: {
    id: 'java',
    label: 'Java 21 (OpenJDK)',
    icon: 'fa-brands fa-java',
    color: '#ef4444',
    prismLang: 'java',
    tabSpaces: '    ',
    defaultCode: `// Java 21 (OpenJDK) Playground
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        System.out.println("Hello from Java 21!");
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line != null) {
            System.out.println("Standard Input: " + line);
        }
    }
}
`
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript (Node 20)',
    icon: 'fa-brands fa-js',
    color: '#facc15',
    prismLang: 'javascript',
    tabSpaces: '  ',
    defaultCode: `// JavaScript (Node.js 20) Playground
const fs = require('fs');

console.log("Hello from JavaScript (Node.js 20)!");
try {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (input) {
    console.log("Standard Input:", input);
  }
} catch (e) {
  // no stdin provided
}
`
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript 5.3',
    icon: 'fa-solid fa-file-code',
    color: '#3b82f6',
    prismLang: 'javascript',
    tabSpaces: '  ',
    defaultCode: `// TypeScript 5.3 Playground
interface User {
  id: number;
  name: string;
  role: string;
}

const user: User = {
  id: 1,
  name: "Developer",
  role: "Full Stack Engineer"
};

console.log(\`Hello from TypeScript! User: \${user.name} (\${user.role})\`);
`
  },
  c: {
    id: 'c',
    label: 'C (GCC 13)',
    icon: 'fa-solid fa-c',
    color: '#94a3b8',
    prismLang: 'c',
    tabSpaces: '    ',
    defaultCode: `// C (GCC 13) Playground
#include <stdio.h>
#include <stdlib.h>

int main() {
    printf("Hello from C (GCC 13)!\\n");
    char buffer[256];
    if (fgets(buffer, sizeof(buffer), stdin)) {
        printf("Standard Input: %s", buffer);
    }
    return 0;
}
`
  },
  sql: {
    id: 'sql',
    label: 'ANSI SQL',
    icon: 'fa-solid fa-database',
    color: '#06b6d4',
    prismLang: 'sql',
    tabSpaces: '  ',
    defaultCode: `-- ANSI SQL Query Playground
-- Supports SELECT, JOIN, GROUP BY, Window Functions & CTEs
WITH SampleData AS (
  SELECT 1 AS id, 'Alice' AS name, 95 AS score
  UNION ALL
  SELECT 2 AS id, 'Bob' AS name, 88 AS score
  UNION ALL
  SELECT 3 AS id, 'Charlie' AS name, 92 AS score
)
SELECT 
  id, 
  name, 
  score,
  DENSE_RANK() OVER (ORDER BY score DESC) AS \`rank\`
FROM SampleData;
`
  },
  go: {
    id: 'go',
    label: 'Go 1.22',
    icon: 'fa-brands fa-golang',
    color: '#00add8',
    prismLang: 'javascript',
    tabSpaces: '    ',
    defaultCode: `// Go 1.22 Playground
package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    fmt.Println("Hello from Go 1.22!")
    scanner := bufio.NewScanner(os.Stdin)
    if scanner.Scan() {
        fmt.Println("Standard Input:", scanner.Text())
    }
}
`
  },
  rust: {
    id: 'rust',
    label: 'Rust 1.76',
    icon: 'fa-brands fa-rust',
    color: '#f97316',
    prismLang: 'javascript',
    tabSpaces: '    ',
    defaultCode: `// Rust 1.76 Playground
use std::io::{self, BufRead};

fn main() {
    println!("Hello from Rust 1.76!");
    let stdin = io::stdin();
    if let Some(Ok(line)) = stdin.lock().lines().next() {
        println!("Standard Input: {}", line);
    }
}
`
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby 3.3',
    icon: 'fa-solid fa-gem',
    color: '#e11d48',
    prismLang: 'python',
    tabSpaces: '  ',
    defaultCode: `# Ruby 3.3 Playground
puts "Hello from Ruby 3.3!"

input = ARGF.read.strip rescue nil
if input && !input.empty?
  puts "Standard Input: #{input}"
end
`
  },
  php: {
    id: 'php',
    label: 'PHP 8.3',
    icon: 'fa-brands fa-php',
    color: '#8b5cf6',
    prismLang: 'javascript',
    tabSpaces: '    ',
    defaultCode: `<?php
// PHP 8.3 Playground
echo "Hello from PHP 8.3!\\n";
$input = trim(file_get_contents('php://stdin'));
if ($input) {
    echo "Standard Input: " . $input . "\\n";
}
?>
`
  }
};
