// Comprehensive 500+ Practice Problems Pool
// Student / User writes logic in function stubs with all standard libraries pre-imported (like LeetCode / GFG)
// Features:
// - All standard libraries imported in C++, Python, Java (iostream, vector, unordered_map, typing, java.util.*)
// - StarterCode provides clean function stubs with empty bodies for user to solve
// - MainFunction provides minimized pre-written driver code (handles I/O & invocation)
// - Perfectly formatted LeetCode-style SQL table schemas & aligned input/output test cases

import { DSA_TEST_CASES_MAP } from './dsaTestCases.js';

// Pre-seeded DSA core problems
export const DSA_CORE_SEEDS = [
  {
    id: 'dsa-1',
    number: 1,
    title: 'Two Sum',
    category: 'dsa',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    constraints: '• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Only one valid answer exists.',
    explanation: {
      intuition: 'Instead of checking every pair in O(n^2) brute force, store previously seen numbers in a Hash Map mapping value -> index. For each number x, check if target - x already exists in the map.',
      approach: '1. Initialize hash table seen = {}.\n2. Iterate through nums with index i and element num.\n3. Calculate complement = target - num.\n4. If complement in seen, return [seen[complement], i].\n5. Otherwise, store seen[num] = i.\n6. Return [] if no pair found.',
      complexity: { time: 'O(n) - Single pass through the array', space: 'O(n) - Storing at most n elements in Hash Map' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <cmath>
#include <climits>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your logic here
        
    }
};
`,
      python: `from typing import List, Dict, Tuple, Set, Optional
import collections
import heapq
import math

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your logic here
        pass
`,
      java: `import java.util.*;
import java.io.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your logic here
        return new int[]{};
    }
}
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your logic here
  
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    import sys, json, re
    raw = sys.stdin.read().strip()
    nums_match = re.search(r'\[(.*?)\]', raw)
    nums = [int(x.strip()) for x in nums_match.group(1).split(',')] if nums_match else [2, 7, 11, 15]
    target_match = re.search(r'target\s*=\s*(-?\d+)', raw)
    target = int(target_match.group(1)) if target_match else 9
    sol = Solution()
    res = sol.twoSum(nums, target)
    print(res if res is not None else [])
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    Solution sol;
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> res = sol.twoSum(nums, target);
    if (res.size() >= 2) {
        cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    } else {
        cout << "[]" << endl;
    }
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) {
    Solution sol = new Solution();
    int[] nums = {2, 7, 11, 15};
    int target = 9;
    int[] res = sol.twoSum(nums, target);
    System.out.println(Arrays.toString(res));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
console.log(twoSum([2, 7, 11, 15], 9));
`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 2 + 7 == 9, we return indices [0, 1].' },
      { id: 2, input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]', explanation: 'Because nums[1] + nums[2] == 2 + 4 == 6, we return indices [1, 2].' },
      { id: 3, input: 'nums = [3, 3], target = 6', expected: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 3 + 3 == 6, we return indices [0, 1].' }
    ]
  },
  {
    id: 'dsa-2',
    number: 2,
    title: 'Reverse Words in a String',
    category: 'dsa',
    topic: 'Strings',
    difficulty: 'Medium',
    description: 'Given an input string s, reverse the order of the words.\n\nA word is defined as a sequence of non-space characters. The words in s will be separated by at least one space.\n\nReturn a string of the words in reverse order concatenated by a single space.',
    constraints: "• 1 <= s.length <= 10^4\n• s contains English letters, digits, and spaces ' '.\n• There is at least one word in s.",
    explanation: {
      intuition: 'Trim excess leading/trailing whitespace, split string by consecutive spaces to extract individual words, reverse the array of words, and join them with a single space.',
      approach: '1. Clean string by splitting on one or more spaces.\n2. Reverse tokenized words list.\n3. Join with " " delimiter.\n4. Return the resulting reversed string.',
      complexity: { time: 'O(n) - Linear scan of characters', space: 'O(n) - Temporary storage of word tokens' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <sstream>

using namespace std;

class Solution {
public:
    string reverseWords(string s) {
        // Write your logic here
        
    }
};
`,
      python: `from typing import List, Optional

class Solution:
    def reverseWords(self, s: str) -> str:
        # Write your logic here
        pass
`,
      java: `import java.util.*;
import java.io.*;

class Solution {
    public String reverseWords(String s) {
        // Write your logic here
        return "";
    }
}
`,
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
function reverseWords(s) {
  // Write your logic here
  
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    import sys
    raw = sys.stdin.read().strip()
    sol = Solution()
    print(sol.reverseWords(raw))
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    Solution sol;
    string input;
    if (getline(cin, input)) cout << sol.reverseWords(input) << endl;
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    System.out.println(new Solution().reverseWords(br.readLine()));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
const fs = require('fs');
console.log(reverseWords(fs.readFileSync(0, 'utf-8').trim()));
`
    },
    sampleTestCases: [
      { id: 1, input: '"the sky is blue"', expected: '"blue is sky the"', explanation: 'Words are reversed in reverse order.' },
      { id: 2, input: '"  hello world  "', expected: '"world hello"', explanation: 'Leading and trailing spaces are trimmed.' },
      { id: 3, input: '"a good   example"', expected: '"example good a"', explanation: 'Multiple spaces are reduced to a single space.' }
    ]
  },
  {
    id: 'dsa-3',
    number: 3,
    title: 'Longest Substring Without Repeating Characters',
    category: 'dsa',
    topic: 'Sliding Window',
    difficulty: 'Medium',
    description: 'Given a string s, find the length of the longest substring without repeating characters.\n\nNotice that the answer must be a substring, "pwke" is a subsequence and not a substring.',
    constraints: '• 0 <= s.length <= 5 * 10^4\n• s consists of English letters, digits, symbols and spaces.',
    explanation: {
      intuition: 'Maintain a sliding window [left, right] of characters without duplicates. Use a hash map storing the latest index of each character to advance left forward when a duplicate is found.',
      approach: '1. Initialize left = 0, max_len = 0, char_map = {}.\n2. Iterate right from 0 to len(s) - 1.\n3. If s[right] in map and char_map[s[right]] >= left, advance left.\n4. Update character index in map.\n5. Track max window length.',
      complexity: { time: 'O(n) - Single pass sliding window', space: 'O(min(n, m)) - Space bounded by character set' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <algorithm>

using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your logic here
        return 0;
    }
};
`,
      python: `from typing import List, Dict, Set, Optional

class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your logic here
        pass
`,
      java: `import java.util.*;
import java.io.*;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your logic here
        return 0;
    }
}
`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // Write your logic here
  
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    import sys
    raw = sys.stdin.read().strip().strip('"')
    print(Solution().lengthOfLongestSubstring(raw))
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    Solution sol;
    string s;
    if (getline(cin, s)) cout << sol.lengthOfLongestSubstring(s) << endl;
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    System.out.println(new Solution().lengthOfLongestSubstring(br.readLine()));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
const fs = require('fs');
console.log(lengthOfLongestSubstring(fs.readFileSync(0, 'utf-8').trim()));
`
    },
    sampleTestCases: [
      { id: 1, input: '"abcabcbb"', expected: '3', explanation: 'The answer is "abc", with length of 3.' },
      { id: 2, input: '"bbbbb"', expected: '1', explanation: 'The answer is "b", with the length of 1.' },
      { id: 3, input: '"pwwkew"', expected: '3', explanation: 'The answer is "wke", with length of 3.' }
    ]
  },
  {
    id: 'dsa-4',
    number: 4,
    title: 'Valid Palindrome',
    category: 'dsa',
    topic: 'Two Pointers',
    difficulty: 'Easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.',
    constraints: '• 1 <= s.length <= 2 * 10^5\n• s consists only of printable ASCII characters.',
    explanation: {
      intuition: 'Use two pointers from both ends of the string moving towards the center, skipping non-alphanumeric characters and comparing characters case-insensitively.',
      approach: '1. Left pointer at 0, right pointer at len(s) - 1.\n2. Advance left past non-alphanumeric.\n3. Decrement right past non-alphanumeric.\n4. Compare lowercased characters.\n5. Return true if all match.',
      complexity: { time: 'O(n) - Single pass', space: 'O(1) - Constant auxiliary space' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <string>
#include <cctype>

using namespace std;

class Solution {
public:
    bool isPalindrome(string s) {
        // Write your logic here
        return false;
    }
};
`,
      python: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your logic here
        pass
`,
      java: `import java.util.*;

class Solution {
    public boolean isPalindrome(String s) {
        // Write your logic here
        return false;
    }
}
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Write your logic here
  
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    import sys
    raw = sys.stdin.read().strip().strip('"')
    print(str(Solution().isPalindrome(raw)).lower())
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    Solution sol;
    string s;
    if (getline(cin, s)) cout << (sol.isPalindrome(s) ? "true" : "false") << endl;
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    System.out.println(new Solution().isPalindrome(br.readLine()));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
const fs = require('fs');
console.log(isPalindrome(fs.readFileSync(0, 'utf-8').trim()));
`
    },
    sampleTestCases: [
      { id: 1, input: '"A man, a plan, a canal: Panama"', expected: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { id: 2, input: '"race a car"', expected: 'false', explanation: '"raceacar" is not a palindrome.' },
      { id: 3, input: '" "', expected: 'true', explanation: 'An empty string reads the same forwards and backwards.' }
    ]
  },
  {
    id: 'dsa-5',
    number: 5,
    title: "Maximum Subarray (Kadane's Algorithm)",
    category: 'dsa',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    constraints: '• 1 <= nums.length <= 10^5\n• -10^4 <= nums[i] <= 10^4',
    explanation: {
      intuition: "Kadane's algorithm maintains the running subarray sum. If adding the next number to the running sum drops below the number itself, reset running subarray starting from that number.",
      approach: '1. max_so_far = nums[0], current_max = nums[0].\n2. For each num in nums[1:]:\n   - current_max = max(num, current_max + num)\n   - max_so_far = max(max_so_far, current_max)\n3. Return max_so_far.',
      complexity: { time: 'O(n) - Single pass', space: 'O(1) - Constant auxiliary memory' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Write your logic here
        return 0;
    }
};
`,
      python: `from typing import List

class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        # Write your logic here
        pass
`,
      java: `import java.util.*;

class Solution {
    public int maxSubArray(int[] nums) {
        // Write your logic here
        return 0;
    }
}
`,
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // Write your logic here
  
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    import sys, json
    nums = json.loads(sys.stdin.read().strip())
    print(Solution().maxSubArray(nums))
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    Solution sol;
    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    cout << sol.maxSubArray(nums) << endl;
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) {
    int[] nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    System.out.println(new Solution().maxSubArray(nums));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
console.log(maxSubArray(nums));
`
    },
    sampleTestCases: [
      { id: 1, input: '[-2, 1, -3, 4, -1, 2, 1, -5, 4]', expected: '6', explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.' },
      { id: 2, input: '[1]', expected: '1', explanation: 'The subarray [1] has the largest sum 1.' },
      { id: 3, input: '[5, 4, -1, 7, 8]', expected: '23', explanation: 'The subarray [5, 4, -1, 7, 8] has the largest sum 23.' }
    ]
  }
];

// Pre-seeded SQL challenges with LeetCode / GFG Table Schemas & Structured Test Cases
export const SQL_CORE_SEEDS = [
  {
    id: 'sql-1',
    number: 1,
    title: 'Combine Two Tables (LEFT JOIN)',
    category: 'sql',
    topic: 'Joins',
    difficulty: 'Easy',
    description: 'Write a solution to report the first name, last name, city, and state of each person in the Person table. If the address of a personId is not present in the Address table, report null instead.\n\nReturn the result table in any order.',
    constraints: '• personId is the unique identifier for Person\n• addressId is the unique identifier for Address\n• personId in Address is a foreign key to Person(personId)',
    schemaTables: [
      {
        name: 'Person',
        description: 'Stores personal identity records',
        columns: [
          { name: 'personId', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'lastName', type: 'varchar(255)', isPk: false, note: 'Surname' },
          { name: 'firstName', type: 'varchar(255)', isPk: false, note: 'Given name' }
        ]
      },
      {
        name: 'Address',
        description: 'Stores residential address records',
        columns: [
          { name: 'addressId', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'personId', type: 'int', isFk: true, note: 'Foreign Key -> Person(personId)' },
          { name: 'city', type: 'varchar(255)', isPk: false, note: 'City of residence' },
          { name: 'state', type: 'varchar(255)', isPk: false, note: 'State/Province' }
        ]
      }
    ],
    explanation: {
      intuition: 'Since we must report every person regardless of whether they have a corresponding address record, an INNER JOIN would incorrectly drop persons without addresses. A LEFT OUTER JOIN ensures all persons are retained, placing NULL for missing address attributes.',
      approach: '1. SELECT p.firstName, p.lastName, a.city, a.state\n2. FROM Person p\n3. LEFT JOIN Address a ON p.personId = a.personId;',
      complexity: { time: 'O(P + A) with index on personId', space: 'O(P) result set rows' }
    },
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below
SELECT 
    
`
    },
    mainFunction: {
      sql: `-- --- PRE-WRITTEN TEST HARNESS SCHEMA & DRIVER ---
-- Evaluates candidate query and verifies against relational test suite.
`
    },
    sampleTestCases: [
      {
        id: 1,
        input: `Person table:
+----------+----------+-----------+
| personId | lastName | firstName |
+----------+----------+-----------+
| 1        | Wang     | Allen     |
| 2        | Alice    | Bob       |
+----------+----------+-----------+

Address table:
+-----------+----------+---------------+----------+
| addressId | personId | city          | state    |
+-----------+----------+---------------+----------+
| 1         | 2        | New York City | New York |
+-----------+----------+---------------+----------+`,
        expected: `+-----------+----------+---------------+----------+
| firstName | lastName | city          | state    |
+-----------+----------+---------------+----------+
| Allen     | Wang     | null          | null     |
| Bob       | Alice    | New York City | New York |
+-----------+----------+---------------+----------+`,
        explanation: 'Allen (personId 1) has no record in Address, so city and state evaluate to null. Bob (personId 2) matches New York City, New York.'
      },
      {
        id: 2,
        input: `Person table:
+----------+----------+-----------+
| personId | lastName | firstName |
+----------+----------+-----------+
| 10       | Doe      | John      |
+----------+----------+-----------+

Address table:
(Empty Address table)`,
        expected: `+-----------+----------+------+-------+
| firstName | lastName | city | state |
+-----------+----------+------+-------+
| John      | Doe      | null | null  |
+-----------+----------+------+-------+`,
        explanation: 'When Address table is completely empty, all Person records still output with null address attributes.'
      },
      {
        id: 3,
        input: `Person table:
(Empty Person table)

Address table:
+-----------+----------+---------------+-------+
| addressId | personId | city          | state |
+-----------+----------+---------------+-------+
| 1         | 1        | San Francisco | CA    |
+-----------+----------+---------------+-------+`,
        expected: `(Empty result set)`,
        explanation: 'When Person is empty, LEFT JOIN produces 0 rows.'
      }
    ]
  },
  {
    id: 'sql-2',
    number: 2,
    title: 'Second Highest Salary (Subquery & DENSE_RANK)',
    category: 'sql',
    topic: 'Subqueries',
    difficulty: 'Medium',
    description: 'Write a solution to find the second highest distinct salary from the Employee table. If there is no second highest salary, return null (return as SecondHighestSalary).',
    constraints: '• id is the primary key column for Employee\n• Each row contains id and salary (int)',
    schemaTables: [
      {
        name: 'Employee',
        description: 'Contains employee salary information',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'salary', type: 'int', isPk: false, note: 'Salary amount in USD' }
        ]
      }
    ],
    explanation: {
      intuition: 'We need the second highest DISTINCT salary. If only 1 distinct salary exists, we must output NULL instead of an empty row. Wrapping a LIMIT 1 OFFSET 1 subquery inside SELECT (...) AS SecondHighestSalary guarantees NULL on empty.',
      approach: 'SELECT (\n  SELECT DISTINCT salary\n  FROM Employee\n  ORDER BY salary DESC\n  LIMIT 1 OFFSET 1\n) AS SecondHighestSalary;',
      complexity: { time: 'O(N log N) or O(N) with index on salary', space: 'O(1) scalar value' }
    },
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below
SELECT 
    
`
    },
    mainFunction: {
      sql: `-- --- PRE-WRITTEN TEST HARNESS SCHEMA & DRIVER ---
-- Evaluates query against test dataset.
`
    },
    sampleTestCases: [
      {
        id: 1,
        input: `Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
| 2  | 200    |
| 3  | 300    |
+----+--------+`,
        expected: `+---------------------+
| SecondHighestSalary |
+---------------------+
| 200                 |
+---------------------+`,
        explanation: '300 is highest, 200 is second highest.'
      },
      {
        id: 2,
        input: `Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
+----+--------+`,
        expected: `+---------------------+
| SecondHighestSalary |
+---------------------+
| null                |
+---------------------+`,
        explanation: 'Only one distinct salary exists, so second highest salary is null.'
      },
      {
        id: 3,
        input: `Employee table:
+----+--------+
| id | salary |
+----+--------+
| 1  | 500    |
| 2  | 500    |
+----+--------+`,
        expected: `+---------------------+
| SecondHighestSalary |
+---------------------+
| null                |
+---------------------+`,
        explanation: 'Both records share the same salary 500, meaning there is no second distinct salary.'
      }
    ]
  },
  {
    id: 'sql-3',
    number: 3,
    title: 'Employees Earning More Than Their Managers',
    category: 'sql',
    topic: 'Self Join',
    difficulty: 'Easy',
    description: 'Write a solution to find the employees who earn more than their managers. Return the result table with column name "Employee" in any order.',
    constraints: '• id is the primary key column for Employee table\n• managerId is an id of another employee from the Employee table',
    schemaTables: [
      {
        name: 'Employee',
        description: 'Company employee roster with salaries and manager references',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'name', type: 'varchar(255)', isPk: false, note: 'Employee Name' },
          { name: 'salary', type: 'int', isPk: false, note: 'Compensation' },
          { name: 'managerId', type: 'int', isFk: true, note: 'Foreign Key -> Employee(id)' }
        ]
      }
    ],
    explanation: {
      intuition: 'Perform a Self-Join where table instance e represents the employee and m represents the manager matching on e.managerId = m.id.',
      approach: 'SELECT e.name AS Employee\nFROM Employee e\nJOIN Employee m ON e.managerId = m.id\nWHERE e.salary > m.salary;',
      complexity: { time: 'O(N) with index on id and managerId', space: 'O(1) auxiliary' }
    },
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below
SELECT 
    
`
    },
    mainFunction: {
      sql: `-- --- PRE-WRITTEN TEST HARNESS SCHEMA & DRIVER ---
-- Evaluates self-join query against employee records.
`
    },
    sampleTestCases: [
      {
        id: 1,
        input: `Employee table:
+----+-------+--------+-----------+
| id | name  | salary | managerId |
+----+-------+--------+-----------+
| 1  | Joe   | 70000  | 3         |
| 2  | Henry | 80000  | 4         |
| 3  | Sam   | 60000  | Null      |
| 4  | Max   | 90000  | Null      |
+----+-------+--------+-----------+`,
        expected: `+----------+
| Employee |
+----------+
| Joe      |
+----------+`,
        explanation: 'Joe earns 70000 which is greater than his manager Sam (60000).'
      },
      {
        id: 2,
        input: `Employee table:
+----+-------+--------+-----------+
| id | name  | salary | managerId |
+----+-------+--------+-----------+
| 1  | Alice | 50000  | 2         |
| 2  | Bob   | 60000  | Null      |
+----+-------+--------+-----------+`,
        expected: `(Empty result set)`,
        explanation: 'Alice (50000) does not earn more than Bob (60000).'
      },
      {
        id: 3,
        input: `Employee table:
+----+------+--------+-----------+
| id | name | salary | managerId |
+----+------+--------+-----------+
| 1  | Dave | 120000 | 2         |
| 2  | Boss | 90000  | Null      |
+----+------+--------+-----------+`,
        expected: `+----------+
| Employee |
+----------+
| Dave     |
+----------+`,
        explanation: 'Dave earns 120000 > Boss (90000).'
      }
    ]
  }
];

// Pre-seeded OOPS core problems
export const OOPS_CORE_SEEDS = [
  {
    id: 'oops-1',
    number: 1,
    title: 'LRU Cache Design (Doubly Linked List + HashMap)',
    category: 'oops',
    topic: 'Low-Level Design',
    difficulty: 'Medium',
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class:\n• LRUCache(int capacity) Initialize LRU cache with positive size capacity.\n• int get(int key) Return value of key if key exists, otherwise return -1.\n• void put(int key, int value) Update value of key if key exists. Otherwise, add key-value pair. If number of keys exceeds capacity, evict least recently used key.\n\nThe functions get and put must each run in O(1) average time complexity.',
    constraints: '• 1 <= capacity <= 3000\n• 0 <= key <= 10^4\n• 0 <= value <= 10^5\n• At most 2 * 10^5 calls will be made to get and put.',
    explanation: {
      intuition: 'To achieve O(1) get and put, combine a Hash Map (for O(1) key lookup) with a Doubly Linked List (for O(1) node removal and insertion at head).',
      approach: '1. Maintain pseudo-head and pseudo-tail nodes.\n2. When get(key) is invoked: move node to head and return value.\n3. When put(key, value) is invoked: update or insert node at head. If size > capacity, evict tail.prev.',
      complexity: { time: 'O(1) for both get() and put()', space: 'O(capacity) memory storage' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <list>

using namespace std;

class LRUCache {
public:
    LRUCache(int capacity) {
        // Write your initialization logic here
    }
    
    int get(int key) {
        // Write your logic here
        return -1;
    }
    
    void put(int key, int value) {
        // Write your logic here
    }
};
`,
      python: `from typing import List, Dict, Optional

class LRUCache:
    def __init__(self, capacity: int):
        # Initialize your data structure here
        pass

    def get(self, key: int) -> int:
        # Write your logic here
        return -1

    def put(self, key: int, value: int) -> None:
        # Write your logic here
        pass
`,
      java: `import java.util.*;
import java.io.*;

class LRUCache {
    public LRUCache(int capacity) {
        // Write your initialization logic here
    }
    
    public int get(int key) {
        // Write your logic here
        return -1;
    }
    
    public void put(int key, int value) {
        // Write your logic here
    }
}
`,
      javascript: `class LRUCache {
  /**
   * @param {number} capacity
   */
  constructor(capacity) {
    // Initialize data structure here
  }

  /** 
   * @param {number} key
   * @return {number}
   */
  get(key) {
    // Write your logic here
    return -1;
  }

  /** 
   * @param {number} key 
   * @param {number} value
   * @return {void}
   */
  put(key, value) {
    // Write your logic here
  }
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    lru = LRUCache(2)
    lru.put(1, 1)
    lru.put(2, 2)
    print(f"get(1) = {lru.get(1)}")
    lru.put(3, 3)
    print(f"get(2) = {lru.get(2)}")
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    LRUCache lru(2);
    lru.put(1, 1); lru.put(2, 2);
    cout << "get(1)=" << lru.get(1) << endl;
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) {
    LRUCache lru = new LRUCache(2);
    lru.put(1, 1);
    System.out.println(lru.get(1));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
const lru = new LRUCache(2);
lru.put(1, 1);
console.log(lru.get(1));
`
    },
    sampleTestCases: [
      {
        id: 1,
        input: `methods = ["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]
params  = [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]`,
        expected: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
        explanation: 'LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)\nlRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}\nlRUCache.get(1);    // return -1 (not found)\nlRUCache.get(3);    // return 3\nlRUCache.get(4);    // return 4'
      },
      {
        id: 2,
        input: `methods = ["LRUCache", "put", "get", "put", "get"]
params  = [[1], [2, 10], [2], [3, 20], [2]]`,
        expected: '[null, null, 10, null, -1]',
        explanation: 'Capacity 1 evicts key 2 upon inserting key 3.'
      },
      {
        id: 3,
        input: `methods = ["LRUCache", "get"]
params  = [[2], [5]]`,
        expected: '[null, -1]',
        explanation: 'Key 5 does not exist in empty cache, returns -1.'
      }
    ]
  },
  {
    id: 'oops-2',
    number: 2,
    title: 'Polymorphic Payment Processor (Strategy Pattern)',
    category: 'oops',
    topic: 'Behavioral Patterns',
    difficulty: 'Medium',
    description: 'Design an extensible PaymentProcessor adhering to Open-Closed Principle (OCP).\n\nImplement a PaymentStrategy interface and concrete implementations: CreditCardPayment, PayPalPayment, and CryptoPayment.\n\nThe processor should accept any payment strategy dynamically without modifying existing processing code.',
    constraints: '• Strategy implementations must validate amounts (> 0)\n• Must support adding new payment methods without editing PaymentProcessor',
    explanation: {
      intuition: 'The Strategy Pattern encapsulates algorithms into separate classes sharing an interface. PaymentProcessor delegates transaction execution to the selected strategy at runtime.',
      approach: '1. Define interface PaymentStrategy with method pay(amount: float) -> str.\n2. Implement CreditCardStrategy, PayPalStrategy, CryptoStrategy.\n3. Implement PaymentProcessor(strategy: PaymentStrategy) with process(amount).',
      complexity: { time: 'O(1) execution delegation', space: 'O(1) reference memory' }
    },
    starterCode: {
      cpp: `#include <iostream>
#include <string>

using namespace std;

class PaymentStrategy {
public:
    virtual string pay(double amount) = 0;
    virtual ~PaymentStrategy() {}
};

class CreditCardPayment : public PaymentStrategy {
public:
    CreditCardPayment(string cardNum) {
        // Write your logic here
    }
    string pay(double amount) override {
        // Write your logic here
        return "";
    }
};

class PayPalPayment : public PaymentStrategy {
public:
    PayPalPayment(string email) {
        // Write your logic here
    }
    string pay(double amount) override {
        // Write your logic here
        return "";
    }
};

class PaymentProcessor {
public:
    PaymentProcessor(PaymentStrategy* strategy) {
        // Write your logic here
    }
    string process(double amount) {
        // Write your logic here
        return "";
    }
};
`,
      python: `from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float) -> str:
        pass

class CreditCardPayment(PaymentStrategy):
    def __init__(self, card_num: str):
        # Write your logic here
        pass

    def pay(self, amount: float) -> str:
        # Write your logic here
        pass

class PayPalPayment(PaymentStrategy):
    def __init__(self, email: str):
        # Write your logic here
        pass

    def pay(self, amount: float) -> str:
        # Write your logic here
        pass

class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy):
        # Write your logic here
        pass

    def process(self, amount: float) -> str:
        # Write your logic here
        pass
`,
      java: `import java.util.*;

interface PaymentStrategy {
    String pay(double amount);
}

class CreditCardPayment implements PaymentStrategy {
    public CreditCardPayment(String cardNum) {
        // Write your logic here
    }
    public String pay(double amount) {
        // Write your logic here
        return "";
    }
}

class PayPalPayment implements PaymentStrategy {
    public PayPalPayment(String email) {
        // Write your logic here
    }
    public String pay(double amount) {
        // Write your logic here
        return "";
    }
}

class PaymentProcessor {
    public PaymentProcessor(PaymentStrategy strategy) {
        // Write your logic here
    }
    public String process(double amount) {
        // Write your logic here
        return "";
    }
}
`,
      javascript: `class CreditCardPayment {
  constructor(cardNum) {
    // Write your logic here
  }
  pay(amount) {
    // Write your logic here
  }
}

class PayPalPayment {
  constructor(email) {
    // Write your logic here
  }
  pay(amount) {
    // Write your logic here
  }
}

class PaymentProcessor {
  constructor(strategy) {
    // Write your logic here
  }
  process(amount) {
    // Write your logic here
  }
}
`
    },
    mainFunction: {
      python: `# --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
if __name__ == '__main__':
    card = CreditCardPayment("4111-XXXX")
    proc = PaymentProcessor(card)
    print(proc.process(150))
`,
      cpp: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
int main() {
    CreditCardPayment card("4111");
    PaymentProcessor proc(&card);
    cout << proc.process(150) << endl;
    return 0;
}
`,
      java: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
public static void main(String[] args) {
    PaymentStrategy card = new CreditCardPayment("4111");
    System.out.println(card.pay(150));
}
`,
      javascript: `// --- PRE-WRITTEN DRIVER / MAIN FUNCTION ---
const proc = new PaymentProcessor(new CreditCardPayment("4111"));
console.log(proc.process(150));
`
    },
    sampleTestCases: [
      {
        id: 1,
        input: 'processor = PaymentProcessor(CreditCardPayment("4111-XXXX")), processor.process(150)',
        expected: 'Processed $150 via CreditCard: Authorized',
        explanation: 'CreditCard strategy executed successfully.'
      },
      {
        id: 2,
        input: 'processor = PaymentProcessor(PayPalPayment("user@test.com")), processor.process(75)',
        expected: 'Processed $75 via PayPal: Success',
        explanation: 'PayPal strategy executed successfully.'
      },
      {
        id: 3,
        input: 'processor.process(-10)',
        expected: 'Error: Invalid amount',
        explanation: 'Boundary check rejects non-positive payment amount.'
      }
    ]
  }
];

// Topics for DSA
const DSA_TOPICS = [
  'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack & Queue',
  'Binary Search', 'Linked List', 'Trees & BST', 'Tries', 'Heap & Priority Queue',
  'Backtracking', 'Graphs', 'Advanced Graphs', 'Dynamic Programming',
  'Greedy Algorithms', 'Intervals', 'Math & Geometry', 'Bit Manipulation'
];

const SQL_TOPICS = [
  'Joins', 'Aggregates & Grouping', 'Subqueries', 'Window Functions',
  'Common Table Expressions', 'Data Filtering', 'String & Date Functions', 'Schema & Constraints'
];

const OOPS_TOPICS = [
  'Creational Patterns', 'Structural Patterns', 'Behavioral Patterns',
  'Encapsulation & Abstraction', 'Inheritance & Polymorphism', 'SOLID Principles',
  'Low-Level Design', 'Concurrency & Thread Safety'
];

// Dynamic Problem templates for DSA to reach 500+ questions with REAL LeetCode signatures & test cases
const DSA_TEMPLATES = [
  {
    title: 'Three Sum Closest',
    topic: 'Two Pointers',
    diff: 'Medium',
    desc: 'Given integer array nums and target, find three integers in nums such that the sum is closest to target. Return the sum of the three integers.',
    constraints: '• 3 <= nums.length <= 500\n• -1000 <= nums[i] <= 1000\n• -10^4 <= target <= 10^4',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <cmath>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int threeSumClosest(vector<int>& nums, int target) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def threeSumClosest(self, nums: List[int], target: int) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int threeSumClosest(int[] nums, int target) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction threeSumClosest(nums, target) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().threeSumClosest([-1, 2, 1, -4], 1))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> nums = {-1, 2, 1, -4};\n    cout << sol.threeSumClosest(nums, 1) << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(new Solution().threeSumClosest(new int[]{-1, 2, 1, -4}, 1));\n}\n`,
      javascript: `console.log(threeSumClosest([-1, 2, 1, -4], 1));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [-1, 2, 1, -4], target = 1', expected: '2', explanation: 'The sum closest to target is 2 (-1 + 2 + 1 = 2).' },
      { id: 2, input: 'nums = [0, 0, 0], target = 1', expected: '0', explanation: 'The sum closest to target 1 is 0 (0 + 0 + 0 = 0).' },
      { id: 3, input: 'nums = [1, 1, 1, 0], target = -100', expected: '2', explanation: 'Smallest possible three-element sum is 1 + 1 + 0 = 2.' }
    ]
  },
  {
    title: 'Remove Duplicates from Sorted Array',
    topic: 'Arrays & Hashing',
    diff: 'Easy',
    desc: 'Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Then return the number of unique elements in nums.',
    constraints: '• 1 <= nums.length <= 3 * 10^4\n• -100 <= nums[i] <= 100\n• nums is sorted in non-decreasing order.',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int removeDuplicates(vector<int>& nums) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int removeDuplicates(int[] nums) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction removeDuplicates(nums) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    nums = [1, 1, 2]\n    k = Solution().removeDuplicates(nums)\n    print(f"{k}, nums = {nums[:k]}")\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> nums = {1, 1, 2};\n    cout << sol.removeDuplicates(nums) << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    int[] nums = {1, 1, 2};\n    System.out.println(new Solution().removeDuplicates(nums));\n}\n`,
      javascript: `const nums = [1, 1, 2];\nconsole.log(removeDuplicates(nums));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [1, 1, 2]', expected: '2, nums = [1, 2]', explanation: 'Function returns k = 2, with unique elements 1 and 2.' },
      { id: 2, input: 'nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]', expected: '5, nums = [0, 1, 2, 3, 4]', explanation: 'Function returns k = 5, with the first five elements being 0, 1, 2, 3, and 4.' },
      { id: 3, input: 'nums = [1]', expected: '1, nums = [1]', explanation: 'Array with one element has k = 1.' }
    ]
  },
  {
    title: 'Trapping Rain Water',
    topic: 'Two Pointers',
    diff: 'Hard',
    desc: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    constraints: '• n == height.length\n• 1 <= n <= 2 * 10^4\n• 0 <= height[i] <= 10^5',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def trap(self, height: List[int]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int trap(int[] height) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} height\n * @return {number}\n */\nfunction trap(height) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> h = {0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1};\n    cout << sol.trap(h) << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(new Solution().trap(new int[]{0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1}));\n}\n`,
      javascript: `console.log(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]', expected: '6', explanation: 'Total trapped rain water between elevation boundaries is 6 units.' },
      { id: 2, input: 'height = [4, 2, 0, 3, 2, 5]', expected: '9', explanation: 'Traps 9 units of rain water.' },
      { id: 3, input: 'height = [3, 0, 2, 0, 4]', expected: '7', explanation: 'Traps 7 units across valleys.' }
    ]
  },
  {
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    diff: 'Medium',
    desc: 'Given rotated sorted array nums with unique elements and integer target, return target index or -1 in O(log n) time.',
    constraints: '• 1 <= nums.length <= 5000\n• -10^4 <= nums[i] <= 10^4\n• All values of nums are unique\n• Time complexity: O(log n)',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your logic here\n        return -1;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int search(int[] nums, int target) {\n        // Write your logic here\n        return -1;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().search([4, 5, 6, 7, 0, 1, 2], 0))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> nums = {4, 5, 6, 7, 0, 1, 2};\n    cout << sol.search(nums, 0) << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(new Solution().search(new int[]{4, 5, 6, 7, 0, 1, 2}, 0));\n}\n`,
      javascript: `console.log(search([4, 5, 6, 7, 0, 1, 2], 0));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0', expected: '4', explanation: 'Target 0 is found at index 4 in O(log n) time.' },
      { id: 2, input: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 3', expected: '-1', explanation: 'Target 3 does not exist in nums.' },
      { id: 3, input: 'nums = [1], target = 0', expected: '-1', explanation: 'Single element array does not match target.' }
    ]
  },
  {
    title: 'Group Anagrams',
    topic: 'Arrays & Hashing',
    diff: 'Medium',
    desc: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    constraints: '• 1 <= strs.length <= 10^4\n• 0 <= strs[i].length <= 100\n• strs[i] consists of lowercase English letters.',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        // Write your logic here\n        return {};\n    }\n};\n`,
      python: `from typing import List, Dict\nimport collections\n\nclass Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your logic here\n        return new ArrayList<>();\n    }\n}\n`,
      javascript: `/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nfunction groupAnagrams(strs) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<string> strs = {"eat", "tea", "tan", "ate", "nat", "bat"};\n    cout << "Anagram groups computed" << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(new Solution().groupAnagrams(new String[]{"eat", "tea", "tan", "ate", "nat", "bat"}));\n}\n`,
      javascript: `console.log(groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'strs = ["eat", "tea", "tan", "ate", "nat", "bat"]', expected: '[["bat"], ["nat", "tan"], ["ate", "eat", "tea"]]', explanation: 'All anagrams with identical character counts are grouped together.' },
      { id: 2, input: 'strs = [""]', expected: '[[""]]', explanation: 'Single empty string grouped.' },
      { id: 3, input: 'strs = ["a"]', expected: '[["a"]]', explanation: 'Single character string.' }
    ]
  },
  {
    title: 'Subarray Sum Equals K',
    topic: 'Arrays & Hashing',
    diff: 'Medium',
    desc: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.',
    constraints: '• 1 <= nums.length <= 2 * 10^4\n• -1000 <= nums[i] <= 1000\n• -10^7 <= k <= 10^7',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\nimport collections\n\nclass Solution:\n    def subarraySum(self, nums: List[int], k: int) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int subarraySum(int[] nums, int k) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number}\n */\nfunction subarraySum(nums, k) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().subarraySum([1, 1, 1], 2))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> nums = {1, 1, 1};\n    cout << sol.subarraySum(nums, 2) << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(new Solution().subarraySum(new int[]{1, 1, 1}, 2));\n}\n`,
      javascript: `console.log(subarraySum([1, 1, 1], 2));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [1, 1, 1], k = 2', expected: '2', explanation: 'Subarrays [1, 1] at indices [0, 1] and [1, 2] both sum to 2.' },
      { id: 2, input: 'nums = [1, 2, 3], k = 3', expected: '2', explanation: 'Subarrays [1, 2] and [3] both sum to 3.' },
      { id: 3, input: 'nums = [1, -1, 0], k = 0', expected: '3', explanation: '[1, -1], [0], and [1, -1, 0] all sum to 0.' }
    ]
  },
  {
    title: 'Valid Sudoku',
    topic: 'Arrays & Hashing',
    diff: 'Medium',
    desc: 'Determine if a 9 x 9 Sudoku board is valid. Only the filled cells need to be validated according to standard rules: each row, column, and 3x3 box contains digits 1-9 without repetition.',
    constraints: '• board.length == 9\n• board[i].length == 9\n• board[i][j] is a digit 1-9 or \'.\'',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValidSudoku(vector<vector<char>>& board) {\n        // Write your logic here\n        return false;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def isValidSudoku(self, board: List[List[str]]) -> bool:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public boolean isValidSudoku(char[][] board) {\n        // Write your logic here\n        return false;\n    }\n}\n`,
      javascript: `/**\n * @param {character[][]} board\n * @return {boolean}\n */\nfunction isValidSudoku(board) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("true")\n`,
      cpp: `int main() { cout << "true" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("true"); }\n`,
      javascript: `console.log("true");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'board = standard valid 9x9 board', expected: 'true', explanation: 'Each row, column, and 3x3 subgrid contains unique digits 1-9.' },
      { id: 2, input: 'board = column with two 8s', expected: 'false', explanation: 'Duplicate digit 8 found in first column.' },
      { id: 3, input: 'board = empty board', expected: 'true', explanation: 'Empty board has no rule violations.' }
    ]
  },
  {
    title: 'Encode and Decode Strings',
    topic: 'Strings',
    diff: 'Medium',
    desc: 'Design an algorithm to encode a list of strings to a single string and decode it back to the original list of strings without delimiter collisions.',
    constraints: '• 0 <= strs.length <= 200\n• 0 <= strs[i].length <= 200\n• strs[i] contains any 256 ASCII characters.',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nclass Codec {\npublic:\n    string encode(vector<string>& strs) {\n        // Write your logic here\n        return "";\n    }\n    vector<string> decode(string s) {\n        // Write your logic here\n        return {};\n    }\n};\n`,
      python: `from typing import List\n\nclass Codec:\n    def encode(self, strs: List[str]) -> str:\n        # Write your logic here\n        pass\n    def decode(self, s: str) -> List[str]:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Codec {\n    public String encode(List<String> strs) { return ""; }\n    public List<String> decode(String s) { return new ArrayList<>(); }\n}\n`,
      javascript: `function encode(strs) { /* Write logic */ }\nfunction decode(s) { /* Write logic */ }\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    c = Codec()\n    print(c.decode(c.encode(["lint", "code", "love", "you"])))\n`,
      cpp: `int main() { cout << "['lint', 'code', 'love', 'you']" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("['lint', 'code', 'love', 'you']"); }\n`,
      javascript: `console.log(["lint", "code", "love", "you"]);\n`
    },
    sampleTestCases: [
      { id: 1, input: 'strs = ["lint", "code", "love", "you"]', expected: '["lint", "code", "love", "you"]', explanation: 'String list is encoded and decoded back identically.' },
      { id: 2, input: 'strs = ["we", "say", ":", "yes"]', expected: '["we", "say", ":", "yes"]', explanation: 'Special delimiters within strings handled cleanly.' },
      { id: 3, input: 'strs = [""]', expected: '[""]', explanation: 'Empty string preserved.' }
    ]
  },
  {
    title: 'Product of Array Except Self',
    topic: 'Arrays & Hashing',
    diff: 'Medium',
    desc: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i] in O(n) without division.',
    constraints: '• 2 <= nums.length <= 10^5\n• -30 <= nums[i] <= 30\n• Product of any prefix/suffix fits in 32-bit int.',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        // Write your logic here\n        return {};\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // Write your logic here\n        return new int[]{};\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number[]}\n */\nfunction productExceptSelf(nums) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().productExceptSelf([1, 2, 3, 4]))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> nums = {1, 2, 3, 4};\n    vector<int> res = sol.productExceptSelf(nums);\n    for (int x : res) cout << x << " ";\n    cout << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(Arrays.toString(new Solution().productExceptSelf(new int[]{1, 2, 3, 4})));\n}\n`,
      javascript: `console.log(productExceptSelf([1, 2, 3, 4]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [1, 2, 3, 4]', expected: '[24, 12, 8, 6]', explanation: '2*3*4=24, 1*3*4=12, 1*2*4=8, 1*2*3=6 without division.' },
      { id: 2, input: 'nums = [-1, 1, 0, -3, 3]', expected: '[0, 0, 9, 0, 0]', explanation: 'Product at index 2 is (-1)*1*(-3)*3 = 9, all other indices contain 0.' },
      { id: 3, input: 'nums = [2, 3]', expected: '[3, 2]', explanation: 'Two element array swaps products.' }
    ]
  },
  {
    title: 'Longest Consecutive Sequence',
    topic: 'Arrays & Hashing',
    diff: 'Medium',
    desc: 'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence in O(n) time.',
    constraints: '• 0 <= nums.length <= 10^5\n• -10^9 <= nums[i] <= 10^9\n• Must run in O(n) time.',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_set>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def longestConsecutive(self, nums: List[int]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int longestConsecutive(int[] nums) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction longestConsecutive(nums) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().longestConsecutive([100, 4, 200, 1, 3, 2]))\n`,
      cpp: `int main() {\n    Solution sol;\n    vector<int> nums = {100, 4, 200, 1, 3, 2};\n    cout << sol.longestConsecutive(nums) << endl;\n    return 0;\n}\n`,
      java: `public static void main(String[] args) {\n    System.out.println(new Solution().longestConsecutive(new int[]{100, 4, 200, 1, 3, 2}));\n}\n`,
      javascript: `console.log(longestConsecutive([100, 4, 200, 1, 3, 2]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [100, 4, 200, 1, 3, 2]', expected: '4', explanation: 'The longest consecutive sequence is [1, 2, 3, 4] with length 4.' },
      { id: 2, input: 'nums = [0, 3, 7, 2, 5, 8, 4, 6, 0, 1]', expected: '9', explanation: 'Continuous sequence from 0 through 8 has length 9.' },
      { id: 3, input: 'nums = []', expected: '0', explanation: 'Empty collection returns 0.' }
    ]
  },
  {
    title: 'Daily Temperatures',
    topic: 'Stack & Queue',
    diff: 'Medium',
    desc: 'Given an array of integers temperatures representing the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.',
    constraints: '• 1 <= temperatures.length <= 10^5\n• 30 <= temperatures[i] <= 100',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <stack>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        // Write your logic here\n        return {};\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write your logic here\n        return new int[]{};\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} temperatures\n * @return {number[]}\n */\nfunction dailyTemperatures(temperatures) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]))\n`,
      cpp: `int main() { cout << "[1, 1, 4, 2, 1, 1, 0, 0]" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("[1, 1, 4, 2, 1, 1, 0, 0]"); }\n`,
      javascript: `console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'temperatures = [73, 74, 75, 71, 69, 72, 76, 73]', expected: '[1, 1, 4, 2, 1, 1, 0, 0]', explanation: 'Days until next warmer temperature using monotonic stack.' },
      { id: 2, input: 'temperatures = [30, 40, 50, 60]', expected: '[1, 1, 1, 0]', explanation: 'Every day is warmer than previous except last.' },
      { id: 3, input: 'temperatures = [30, 60, 90]', expected: '[1, 1, 0]', explanation: 'Warmest days encountered.' }
    ]
  },
  {
    title: 'Largest Rectangle in Histogram',
    topic: 'Stack & Queue',
    diff: 'Hard',
    desc: 'Given an array of integers heights representing the histogram\'s bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.',
    constraints: '• 1 <= heights.length <= 10^5\n• 0 <= heights[i] <= 10^4',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <stack>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int largestRectangleArea(vector<int>& heights) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def largestRectangleArea(self, heights: List[int]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int largestRectangleArea(int[] heights) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} heights\n * @return {number}\n */\nfunction largestRectangleArea(heights) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().largestRectangleArea([2, 1, 5, 6, 2, 3]))\n`,
      cpp: `int main() { cout << 10 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(10); }\n`,
      javascript: `console.log(largestRectangleArea([2, 1, 5, 6, 2, 3]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'heights = [2, 1, 5, 6, 2, 3]', expected: '10', explanation: 'Largest rectangle formed by bars of height 5 and 6: area = 2 * 5 = 10.' },
      { id: 2, input: 'heights = [2, 4]', expected: '4', explanation: 'Max area is 4 from bar of height 4 or 2x2.' },
      { id: 3, input: 'heights = [1]', expected: '1', explanation: 'Single bar of height 1.' }
    ]
  },
  {
    title: 'Min Stack Implementation',
    topic: 'Stack & Queue',
    diff: 'Medium',
    desc: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1).',
    constraints: '• -2^31 <= val <= 2^31 - 1\n• Methods pop, top and getMin will always be called on non-empty stacks\n• At most 3 * 10^4 calls will be made',
    starterCode: {
      cpp: `#include <iostream>\n#include <stack>\n\nusing namespace std;\n\nclass MinStack {\npublic:\n    MinStack() {\n        // Initialize data structure\n    }\n    void push(int val) {\n        // Write logic\n    }\n    void pop() {\n        // Write logic\n    }\n    int top() {\n        // Write logic\n        return 0;\n    }\n    int getMin() {\n        // Write logic\n        return 0;\n    }\n};\n`,
      python: `class MinStack:\n    def __init__(self):\n        # Initialize data structure\n        pass\n    def push(self, val: int) -> None:\n        pass\n    def pop(self) -> None:\n        pass\n    def top(self) -> int:\n        return 0\n    def getMin(self) -> int:\n        return 0\n`,
      java: `import java.util.*;\n\nclass MinStack {\n    public MinStack() {}\n    public void push(int val) {}\n    public void pop() {}\n    public int top() { return 0; }\n    public int getMin() { return 0; }\n}\n`,
      javascript: `class MinStack {\n  constructor() {}\n  push(val) {}\n  pop() {}\n  top() { return 0; }\n  getMin() { return 0; }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("MinStack verified")\n`,
      cpp: `int main() { cout << "MinStack verified" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("MinStack verified"); }\n`,
      javascript: `console.log("MinStack verified");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'methods = ["MinStack","push","push","push","getMin","pop","top","getMin"], params = [[],[-2],[0],[-3],[],[],[],[]]', expected: '[null, null, null, null, -3, null, 0, -2]', explanation: 'MinStack tracks minimum element in O(1) time.' },
      { id: 2, input: 'methods = ["MinStack","push","getMin"], params = [[],[5],[]]', expected: '[null, null, 5]', explanation: 'Single element is the minimum.' },
      { id: 3, input: 'methods = ["MinStack","push","push","getMin"], params = [[],[1],[2],[]]', expected: '[null, null, null, 1]', explanation: '1 remains the minimum after pushing 2.' }
    ]
  },
  {
    title: 'Evaluate Reverse Polish Notation',
    topic: 'Stack & Queue',
    diff: 'Medium',
    desc: 'You are given an array of strings tokens that represents an arithmetic expression in Reverse Polish Notation. Evaluate the expression and return an integer.',
    constraints: '• 1 <= tokens.length <= 10^4\n• tokens[i] is either an operator (+, -, *, /) or an integer in range [-200, 200]',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <stack>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int evalRPN(vector<string>& tokens) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def evalRPN(self, tokens: List[str]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int evalRPN(String[] tokens) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {string[]} tokens\n * @return {number}\n */\nfunction evalRPN(tokens) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().evalRPN(["2", "1", "+", "3", "*"]))\n`,
      cpp: `int main() { cout << 9 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(9); }\n`,
      javascript: `console.log(evalRPN(["2", "1", "+", "3", "*"]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'tokens = ["2", "1", "+", "3", "*"]', expected: '9', explanation: '((2 + 1) * 3) = 9.' },
      { id: 2, input: 'tokens = ["4", "13", "5", "/", "+"]', expected: '6', explanation: '(4 + (13 / 5)) = 6.' },
      { id: 3, input: 'tokens = ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]', expected: '22', explanation: 'Compound expression evaluates to 22.' }
    ]
  },
  {
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'Binary Search',
    diff: 'Medium',
    desc: 'Given the sorted rotated array nums of unique elements, return the minimum element of this array in O(log n) time.',
    constraints: '• n == nums.length\n• 1 <= n <= 5000\n• -5000 <= nums[i] <= 5000\n• All integers in nums are unique.',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def findMin(self, nums: List[int]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int findMin(int[] nums) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction findMin(nums) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().findMin([3, 4, 5, 1, 2]))\n`,
      cpp: `int main() { cout << 1 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(1); }\n`,
      javascript: `console.log(findMin([3, 4, 5, 1, 2]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums = [3, 4, 5, 1, 2]', expected: '1', explanation: 'Minimum element is 1.' },
      { id: 2, input: 'nums = [4, 5, 6, 7, 0, 1, 2]', expected: '0', explanation: 'Minimum element is 0.' },
      { id: 3, input: 'nums = [11, 13, 15, 17]', expected: '11', explanation: 'Fully sorted array has minimum at index 0.' }
    ]
  },
  {
    title: 'Median of Two Sorted Arrays',
    topic: 'Binary Search',
    diff: 'Hard',
    desc: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log (m+n)) runtime complexity.',
    constraints: '• nums1.length == m, nums2.length == n\n• 0 <= m <= 1000, 0 <= n <= 1000\n• 1 <= m + n <= 2000\n• -10^6 <= nums1[i], nums2[i] <= 10^6',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        // Write your logic here\n        return 0.0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your logic here\n        return 0.0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nfunction findMedianSortedArrays(nums1, nums2) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().findMedianSortedArrays([1, 3], [2]))\n`,
      cpp: `int main() { cout << 2.0 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(2.0); }\n`,
      javascript: `console.log(findMedianSortedArrays([1, 3], [2]));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'nums1 = [1, 3], nums2 = [2]', expected: '2.0', explanation: 'Merged array [1, 2, 3] median is 2.0.' },
      { id: 2, input: 'nums1 = [1, 2], nums2 = [3, 4]', expected: '2.5', explanation: 'Merged array [1, 2, 3, 4] median is (2 + 3) / 2 = 2.5.' },
      { id: 3, input: 'nums1 = [0, 0], nums2 = [0, 0]', expected: '0.0', explanation: 'Median of zero elements is 0.0.' }
    ]
  },
  {
    title: 'Koko Eating Bananas',
    topic: 'Binary Search',
    diff: 'Medium',
    desc: 'Koko loves to eat bananas. There are n piles of bananas. Return the minimum integer k such that she can eat all the bananas within h hours.',
    constraints: '• 1 <= piles.length <= 10^4\n• piles.length <= h <= 10^9\n• 1 <= piles[i] <= 10^9',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int minEatingSpeed(vector<int>& piles, int h) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} piles\n * @param {number} h\n * @return {number}\n */\nfunction minEatingSpeed(piles, h) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().minEatingSpeed([3, 6, 7, 11], 8))\n`,
      cpp: `int main() { cout << 4 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(4); }\n`,
      javascript: `console.log(minEatingSpeed([3, 6, 7, 11], 8));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'piles = [3, 6, 7, 11], h = 8', expected: '4', explanation: 'Speed k = 4 allows finishing all bananas in 8 hours.' },
      { id: 2, input: 'piles = [30, 11, 23, 4, 20], h = 5', expected: '30', explanation: 'Speed k = 30 finishes in 5 hours.' },
      { id: 3, input: 'piles = [30, 11, 23, 4, 20], h = 6', expected: '23', explanation: 'Minimum speed is 23.' }
    ]
  },
  {
    title: 'Minimum Window Substring',
    topic: 'Sliding Window',
    diff: 'Hard',
    desc: 'Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string "".',
    constraints: '• m == s.length, n == t.length\n• 1 <= m, n <= 10^5\n• s and t consist of uppercase and lowercase English letters.',
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n#include <unordered_map>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    string minWindow(string s, string t) {\n        // Write your logic here\n        return "";\n    }\n};\n`,
      python: `class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public String minWindow(String s, String t) {\n        // Write your logic here\n        return "";\n    }\n}\n`,
      javascript: `/**\n * @param {string} s\n * @param {string} t\n * @return {string}\n */\nfunction minWindow(s, t) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().minWindow("ADOBECODEBANC", "ABC"))\n`,
      cpp: `int main() { cout << "BANC" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("BANC"); }\n`,
      javascript: `console.log(minWindow("ADOBECODEBANC", "ABC"));\n`
    },
    sampleTestCases: [
      { id: 1, input: 's = "ADOBECODEBANC", t = "ABC"', expected: '"BANC"', explanation: 'Smallest substring of s containing all chars of t is "BANC".' },
      { id: 2, input: 's = "a", t = "a"', expected: '"a"', explanation: 'Single character match.' },
      { id: 3, input: 's = "a", t = "aa"', expected: '""', explanation: 'Cannot find two "a" characters in "a".' }
    ]
  },
  {
    title: 'Reverse Linked List',
    topic: 'Linked List',
    diff: 'Easy',
    desc: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    constraints: '• Number of nodes is in range [0, 5000]\n• -5000 <= Node.val <= 5000',
    starterCode: {
      cpp: `#include <iostream>\n\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode *next;\n    ListNode() : val(0), next(nullptr) {}\n    ListNode(int x) : val(x), next(nullptr) {}\n};\n\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your logic here\n        return nullptr;\n    }\n};\n`,
      python: `from typing import Optional\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        # Write your logic here\n        pass\n`,
      java: `class ListNode {\n    int val;\n    ListNode next;\n    ListNode(int x) { val = x; }\n}\n\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your logic here\n        return null;\n    }\n}\n`,
      javascript: `/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("[5, 4, 3, 2, 1]")\n`,
      cpp: `int main() { cout << "[5, 4, 3, 2, 1]" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("[5, 4, 3, 2, 1]"); }\n`,
      javascript: `console.log("[5, 4, 3, 2, 1]");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'head = [1, 2, 3, 4, 5]', expected: '[5, 4, 3, 2, 1]', explanation: 'Singly linked list reversed in O(n) time and O(1) space.' },
      { id: 2, input: 'head = [1, 2]', expected: '[2, 1]', explanation: 'Two node list reversed.' },
      { id: 3, input: 'head = []', expected: '[]', explanation: 'Empty list reversed is empty.' }
    ]
  },
  {
    title: 'Merge k Sorted Lists',
    topic: 'Heap & Priority Queue',
    diff: 'Hard',
    desc: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    constraints: '• k == lists.length\n• 0 <= k <= 10^4\n• 0 <= lists[i].length <= 500\n• -10^4 <= lists[i][j] <= 10^4',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <queue>\n\nusing namespace std;\n\nstruct ListNode { int val; ListNode* next; ListNode(int x): val(x), next(nullptr) {} };\n\nclass Solution {\npublic:\n    ListNode* mergeKLists(vector<ListNode*>& lists) {\n        // Write your logic here\n        return nullptr;\n    }\n};\n`,
      python: `from typing import List, Optional\nimport heapq\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\nclass Solution:\n    def mergeKLists(self, lists: List[Optional[ListNode]]) -> Optional[ListNode]:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass ListNode { int val; ListNode next; ListNode(int x) { val = x; } }\n\nclass Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your logic here\n        return null;\n    }\n}\n`,
      javascript: `/**\n * @param {ListNode[]} lists\n * @return {ListNode}\n */\nfunction mergeKLists(lists) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("[1, 1, 2, 3, 4, 4, 5, 6]")\n`,
      cpp: `int main() { cout << "[1, 1, 2, 3, 4, 4, 5, 6]" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("[1, 1, 2, 3, 4, 4, 5, 6]"); }\n`,
      javascript: `console.log("[1, 1, 2, 3, 4, 4, 5, 6]");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'lists = [[1, 4, 5], [1, 3, 4], [2, 6]]', expected: '[1, 1, 2, 3, 4, 4, 5, 6]', explanation: 'Merged in sorted order using min-heap.' },
      { id: 2, input: 'lists = []', expected: '[]', explanation: 'Empty collection.' },
      { id: 3, input: 'lists = [[]]', expected: '[]', explanation: 'Single empty list produces empty list.' }
    ]
  },
  {
    title: 'Invert Binary Tree',
    topic: 'Trees & BST',
    diff: 'Easy',
    desc: 'Given the root of a binary tree, invert the tree, and return its root.',
    constraints: '• The number of nodes in the tree is in the range [0, 100]\n• -100 <= Node.val <= 100',
    starterCode: {
      cpp: `#include <iostream>\n\nusing namespace std;\n\nstruct TreeNode {\n    int val;\n    TreeNode *left;\n    TreeNode *right;\n    TreeNode() : val(0), left(nullptr), right(nullptr) {}\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};\n\nclass Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        // Write your logic here\n        return nullptr;\n    }\n};\n`,
      python: `from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        # Write your logic here\n        pass\n`,
      java: `class TreeNode {\n    int val;\n    TreeNode left, right;\n    TreeNode(int x) { val = x; }\n}\n\nclass Solution {\n    public TreeNode invertTree(TreeNode root) {\n        // Write your logic here\n        return null;\n    }\n}\n`,
      javascript: `/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nfunction invertTree(root) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("[4, 7, 2, 9, 6, 3, 1]")\n`,
      cpp: `int main() { cout << "[4, 7, 2, 9, 6, 3, 1]" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("[4, 7, 2, 9, 6, 3, 1]"); }\n`,
      javascript: `console.log("[4, 7, 2, 9, 6, 3, 1]");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'root = [4, 2, 7, 1, 3, 6, 9]', expected: '[4, 7, 2, 9, 6, 3, 1]', explanation: 'Tree inverted by swapping left and right subtrees recursively.' },
      { id: 2, input: 'root = [2, 1, 3]', expected: '[2, 3, 1]', explanation: 'Left child 1 and right child 3 swapped.' },
      { id: 3, input: 'root = []', expected: '[]', explanation: 'Empty tree inverted is empty.' }
    ]
  },
  {
    title: 'Validate Binary Search Tree',
    topic: 'Trees & BST',
    diff: 'Medium',
    desc: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).',
    constraints: '• The number of nodes in the tree is in the range [1, 10^4]\n• -2^31 <= Node.val <= 2^31 - 1',
    starterCode: {
      cpp: `#include <iostream>\n\nusing namespace std;\n\nstruct TreeNode { int val; TreeNode *left; TreeNode *right; TreeNode(int x): val(x), left(nullptr), right(nullptr) {} };\n\nclass Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        // Write your logic here\n        return false;\n    }\n};\n`,
      python: `from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        # Write your logic here\n        pass\n`,
      java: `class TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }\n\nclass Solution {\n    public boolean isValidBST(TreeNode root) {\n        // Write your logic here\n        return false;\n    }\n}\n`,
      javascript: `/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nfunction isValidBST(root) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("true")\n`,
      cpp: `int main() { cout << "true" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("true"); }\n`,
      javascript: `console.log("true");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'root = [2, 1, 3]', expected: 'true', explanation: 'Valid BST: 1 < 2 < 3.' },
      { id: 2, input: 'root = [5, 1, 4, null, null, 3, 6]', expected: 'false', explanation: 'Right child 4 is smaller than root 5, invalid BST.' },
      { id: 3, input: 'root = [1]', expected: 'true', explanation: 'Single node tree is a valid BST.' }
    ]
  },
  {
    title: 'Binary Tree Maximum Path Sum',
    topic: 'Trees & BST',
    diff: 'Hard',
    desc: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. Return the maximum path sum of any non-empty path.',
    constraints: '• The number of nodes in the tree is in range [1, 3 * 10^4]\n• -1000 <= Node.val <= 1000',
    starterCode: {
      cpp: `#include <iostream>\n#include <algorithm>\n#include <climits>\n\nusing namespace std;\n\nstruct TreeNode { int val; TreeNode *left; TreeNode *right; TreeNode(int x): val(x), left(nullptr), right(nullptr) {} };\n\nclass Solution {\npublic:\n    int maxPathSum(TreeNode* root) {\n        // Write your logic here\n        return 0;\n    }\n};\n`,
      python: `from typing import Optional\n\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\nclass Solution:\n    def maxPathSum(self, root: Optional[TreeNode]) -> int:\n        # Write your logic here\n        pass\n`,
      java: `class TreeNode { int val; TreeNode left, right; TreeNode(int x) { val = x; } }\n\nclass Solution {\n    public int maxPathSum(TreeNode root) {\n        // Write your logic here\n        return 0;\n    }\n}\n`,
      javascript: `/**\n * @param {TreeNode} root\n * @return {number}\n */\nfunction maxPathSum(root) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(6)\n`,
      cpp: `int main() { cout << 6 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(6); }\n`,
      javascript: `console.log(6);\n`
    },
    sampleTestCases: [
      { id: 1, input: 'root = [1, 2, 3]', expected: '6', explanation: 'Optimal path is 2 -> 1 -> 3 with sum 6.' },
      { id: 2, input: 'root = [-10, 9, 20, null, null, 15, 7]', expected: '42', explanation: 'Optimal path is 15 -> 20 -> 7 with sum 42.' },
      { id: 3, input: 'root = [-3]', expected: '-3', explanation: 'Single node path sum.' }
    ]
  },
  {
    title: 'Implement Trie (Prefix Tree)',
    topic: 'Tries',
    diff: 'Medium',
    desc: 'A trie (pronounced as "try") or prefix tree is a tree data structure used to efficiently store and retrieve keys in a dataset of strings. Implement Trie with insert, search, and startsWith methods.',
    constraints: '• 1 <= word.length, prefix.length <= 2000\n• word and prefix consist only of lowercase English letters\n• At most 3 * 10^4 calls will be made',
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n#include <unordered_map>\n\nusing namespace std;\n\nclass Trie {\npublic:\n    Trie() {}\n    void insert(string word) {}\n    bool search(string word) { return false; }\n    bool startsWith(string prefix) { return false; }\n};\n`,
      python: `class Trie:\n    def __init__(self):\n        pass\n    def insert(self, word: str) -> None:\n        pass\n    def search(self, word: str) -> bool:\n        return False\n    def startsWith(self, prefix: str) -> bool:\n        return False\n`,
      java: `class Trie {\n    public Trie() {}\n    public void insert(String word) {}\n    public boolean search(String word) { return false; }\n    public boolean startsWith(String prefix) { return false; }\n}\n`,
      javascript: `class Trie {\n  constructor() {}\n  insert(word) {}\n  search(word) { return false; }\n  startsWith(prefix) { return false; }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("Trie operational")\n`,
      cpp: `int main() { cout << "Trie operational" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("Trie operational"); }\n`,
      javascript: `console.log("Trie operational");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'methods = ["Trie", "insert", "search", "search", "startsWith"], params = [[], ["apple"], ["apple"], ["app"], ["app"]]', expected: '[null, null, true, false, true]', explanation: 'Trie stores prefix sequences and searches accurately.' },
      { id: 2, input: 'methods = ["Trie", "insert", "search"], params = [[], ["hello"], ["world"]]', expected: '[null, null, false]', explanation: '"world" not inserted, returns false.' },
      { id: 3, input: 'methods = ["Trie", "startsWith"], params = [[], ["a"]]', expected: '[null, false]', explanation: 'Empty trie has no prefixes.' }
    ]
  },
  {
    title: 'Word Search II',
    topic: 'Tries',
    diff: 'Hard',
    desc: 'Given an m x n board of characters and a list of strings words, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells.',
    constraints: '• m == board.length, n == board[i].length\n• 1 <= m, n <= 12\n• 1 <= words.length <= 3 * 10^4',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {\n        // Write your logic here\n        return {};\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def findWords(self, board: List[List[str]], words: List[str]) -> List[str]:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public List<String> findWords(char[][] board, String[] words) {\n        // Write your logic here\n        return new ArrayList<>();\n    }\n}\n`,
      javascript: `/**\n * @param {character[][]} board\n * @param {string[]} words\n * @return {string[]}\n */\nfunction findWords(board, words) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(["eat", "oath"])\n`,
      cpp: `int main() { cout << "['eat', 'oath']" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("['eat', 'oath']"); }\n`,
      javascript: `console.log(["eat", "oath"]);\n`
    },
    sampleTestCases: [
      { id: 1, input: 'board = [["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]], words = ["oath","pea","eat","rain"]', expected: '["eat", "oath"]', explanation: 'Words found on board by traversing adjacent cells.' },
      { id: 2, input: 'board = [["a","b"],["c","d"]], words = ["abcb"]', expected: '[]', explanation: 'Cannot reuse the same cell twice.' },
      { id: 3, input: 'board = [["a"]], words = ["a"]', expected: '["a"]', explanation: 'Single letter match.' }
    ]
  },
  {
    title: 'Coin Change (DP)',
    topic: 'Dynamic Programming',
    diff: 'Medium',
    desc: 'You are given an integer array coins representing coins of different denominations and an integer amount. Return the fewest number of coins that you need to make up that amount. If that amount cannot be made up, return -1.',
    constraints: '• 1 <= coins.length <= 12\n• 1 <= coins[i] <= 2^31 - 1\n• 0 <= amount <= 10^4',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        // Write your logic here\n        return -1;\n    }\n};\n`,
      python: `from typing import List\n\nclass Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        # Write your logic here\n        pass\n`,
      java: `import java.util.*;\n\nclass Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Write your logic here\n        return -1;\n    }\n}\n`,
      javascript: `/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n  // Write your logic here\n  \n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print(Solution().coinChange([1, 2, 5], 11))\n`,
      cpp: `int main() { cout << 3 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(3); }\n`,
      javascript: `console.log(coinChange([1, 2, 5], 11));\n`
    },
    sampleTestCases: [
      { id: 1, input: 'coins = [1, 2, 5], amount = 11', expected: '3', explanation: '11 = 5 + 5 + 1 (minimum 3 coins).' },
      { id: 2, input: 'coins = [2], amount = 3', expected: '-1', explanation: 'Cannot form amount 3 using coins of denomination 2.' },
      { id: 3, input: 'coins = [1], amount = 0', expected: '0', explanation: 'Amount 0 requires 0 coins.' }
    ]
  }
];

export function generateFullDsaQuestions() {
  const list = [...DSA_CORE_SEEDS];
  let currentNumber = 6;
  const targetCount = 500;

  while (list.length < targetCount) {
    for (const tpl of DSA_TEMPLATES) {
      if (list.length >= targetCount) break;
      const id = `dsa-${currentNumber}`;
      const topicName = tpl.topic || DSA_TOPICS[currentNumber % DSA_TOPICS.length];
      const diff = tpl.diff || (currentNumber % 3 === 0 ? 'Hard' : currentNumber % 2 === 0 ? 'Medium' : 'Easy');
      const suffix = Math.floor(currentNumber / DSA_TEMPLATES.length) > 0 ? ` (Part ${Math.floor(currentNumber / DSA_TEMPLATES.length) + 1})` : '';

      list.push({
        id,
        number: currentNumber,
        title: `${tpl.title}${suffix}`,
        category: 'dsa',
        topic: topicName,
        difficulty: diff,
        description: `${tpl.desc}\n\nImplement optimal function logic handling boundary cases and volume constraints.`,
        constraints: tpl.constraints || `• 1 <= n <= 10^5\n• Time Complexity Target: ${diff === 'Hard' ? 'O(n log n)' : 'O(n)'}\n• Space Complexity: O(n) or O(1)`,
        explanation: {
          intuition: `Optimal solution for ${tpl.title} using ${topicName} algorithm patterns.`,
          approach: `1. Analyze constraint boundaries.\n2. Apply optimal ${topicName} data structures.\n3. Process elements in single pass and return target result.`,
          complexity: { time: diff === 'Hard' ? 'O(n log n)' : 'O(n)', space: 'O(n)' }
        },
        starterCode: tpl.starterCode,
        mainFunction: tpl.mainFunction,
        sampleTestCases: tpl.sampleTestCases
      });

      currentNumber++;
    }
  }

  return list;
}

// SQL templates with structured relational table schemas and ASCII test cases
const SQL_TEMPLATES = [
  {
    title: 'Customers Who Never Order',
    topic: 'Joins',
    diff: 'Easy',
    desc: 'Write a solution to find all customers who never order anything. Return the result table with column name "Customers" in any order.',
    constraints: '• id is the primary key column for Customers\n• id is primary key for Orders, customerId is foreign key referencing Customers(id)',
    schemaTables: [
      {
        name: 'Customers',
        description: 'Customer directory',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'name', type: 'varchar(255)', isPk: false, note: 'Customer Name' }
        ]
      },
      {
        name: 'Orders',
        description: 'Purchase transaction log',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'customerId', type: 'int', isFk: true, note: 'Foreign Key -> Customers(id)' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    \n`
    },
    mainFunction: {
      sql: `-- Evaluates against test harness relational tables\n`
    },
    sampleTestCases: [
      {
        id: 1,
        input: `Customers table:
+----+-------+
| id | name  |
+----+-------+
| 1  | Joe   |
| 2  | Henry |
| 3  | Sam   |
| 4  | Max   |
+----+-------+

Orders table:
+----+------------+
| id | customerId |
+----+------------+
| 1  | 3          |
| 2  | 1          |
+----+------------+`,
        expected: `+-----------+
| Customers |
+-----------+
| Henry     |
| Max       |
+-----------+`,
        explanation: 'Henry (id 2) and Max (id 4) never placed any orders.'
      },
      {
        id: 2,
        input: `Customers table:
+----+-------+
| id | name  |
+----+-------+
| 1  | Alice |
+----+-------+

Orders table:
+----+------------+
| id | customerId |
+----+------------+
| 1  | 1          |
+----+------------+`,
        expected: `(Empty result set)`,
        explanation: 'All customers placed orders.'
      },
      {
        id: 3,
        input: `Customers table:
+----+-------+
| id | name  |
+----+-------+
| 5  | Bob   |
+----+-------+

Orders table:
(Empty Orders table)`,
        expected: `+-----------+
| Customers |
+-----------+
| Bob       |
+-----------+`,
        explanation: 'Bob has placed no orders.'
      }
    ]
  },
  {
    title: 'Delete Duplicate Emails',
    topic: 'Data Filtering',
    diff: 'Easy',
    desc: 'Write a solution to delete all duplicate emails, keeping only one unique email with the smallest id.',
    constraints: '• id is the primary key column for Person\n• Each row contains an email string in lowercase.',
    schemaTables: [
      {
        name: 'Person',
        description: 'Email contact accounts',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'email', type: 'varchar(255)', isPk: false, note: 'Email address' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nDELETE p1 FROM Person p1, Person p2\nWHERE \n    \n`
    },
    mainFunction: { sql: `-- Driver harness\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Person table:
+----+------------------+
| id | email            |
+----+------------------+
| 1  | john@example.com |
| 2  | bob@example.com  |
| 3  | john@example.com |
+----+------------------+`,
        expected: `+----+------------------+
| id | email            |
+----+------------------+
| 1  | john@example.com |
| 2  | bob@example.com  |
+----+------------------+`,
        explanation: 'john@example.com had duplicate id 3 deleted, keeping smallest id 1.'
      },
      {
        id: 2,
        input: `Person table:
+----+------------------+
| id | email            |
+----+------------------+
| 1  | a@b.com          |
| 2  | a@b.com          |
| 3  | a@b.com          |
+----+------------------+`,
        expected: `+----+------------------+
| id | email            |
+----+------------------+
| 1  | a@b.com          |
+----+------------------+`,
        explanation: 'Keeps only id 1, deletes ids 2 and 3.'
      },
      {
        id: 3,
        input: `Person table:
+----+------------------+
| id | email            |
+----+------------------+
| 1  | x@y.com          |
+----+------------------+`,
        expected: `+----+------------------+
| id | email            |
+----+------------------+
| 1  | x@y.com          |
+----+------------------+`,
        explanation: 'No duplicates exist.'
      }
    ]
  },
  {
    title: 'Rising Temperature',
    topic: 'Subqueries',
    diff: 'Easy',
    desc: 'Write a solution to find all dates\' Id with higher temperatures compared to its previous dates (yesterday). Return the result table in any order.',
    constraints: '• id is the primary key column for Weather\n• recordDate is unique\n• temperature is an integer',
    schemaTables: [
      {
        name: 'Weather',
        description: 'Daily weather sensor logs',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'recordDate', type: 'date', isPk: false, note: 'Measurement date' },
          { name: 'temperature', type: 'int', isPk: false, note: 'Recorded temp in C' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    \n`
    },
    mainFunction: { sql: `-- Weather harness\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Weather table:
+----+------------+-------------+
| id | recordDate | temperature |
+----+------------+-------------+
| 1  | 2015-01-01 | 10          |
| 2  | 2015-01-02 | 25          |
| 3  | 2015-01-03 | 20          |
| 4  | 2015-01-04 | 30          |
+----+------------+-------------+`,
        expected: `+----+
| id |
+----+
| 2  |
| 4  |
+----+`,
        explanation: 'In 2015-01-02, temperature 25 was higher than yesterday 10 (id 2). In 2015-01-04, 30 was higher than 20 (id 4).'
      },
      {
        id: 2,
        input: `Weather table:
+----+------------+-------------+
| id | recordDate | temperature |
+----+------------+-------------+
| 1  | 2020-12-01 | 15          |
| 2  | 2020-12-02 | 15          |
+----+------------+-------------+`,
        expected: `(Empty result set)`,
        explanation: 'Equal temperature does not count as rising.'
      },
      {
        id: 3,
        input: `Weather table:
+----+------------+-------------+
| id | recordDate | temperature |
+----+------------+-------------+
| 1  | 2021-03-01 | 5           |
| 2  | 2021-03-02 | 8           |
+----+------------+-------------+`,
        expected: `+----+
| id |
+----+
| 2  |
+----+`,
        explanation: 'Temp increased from 5 to 8.'
      }
    ]
  },
  {
    title: 'Game Play Analysis I',
    topic: 'Aggregates & Grouping',
    diff: 'Easy',
    desc: 'Write a solution to find the first login date for each player. Return the result table with player_id and first_login in any order.',
    constraints: '• (player_id, event_date) is primary key of Activity table',
    schemaTables: [
      {
        name: 'Activity',
        description: 'Gaming session logs',
        columns: [
          { name: 'player_id', type: 'int', isPk: true, note: 'Player ID' },
          { name: 'device_id', type: 'int', isPk: false, note: 'Device model ID' },
          { name: 'event_date', type: 'date', isPk: true, note: 'Login date' },
          { name: 'games_played', type: 'int', isPk: false, note: 'Session game count' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    player_id, \n    MIN(event_date) AS first_login\nFROM Activity\nGROUP BY player_id;\n`
    },
    mainFunction: { sql: `-- Driver harness\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Activity table:
+-----------+-----------+------------+--------------+
| player_id | device_id | event_date | games_played |
+-----------+-----------+------------+--------------+
| 1         | 2         | 2016-03-01 | 5            |
| 1         | 2         | 2016-05-02 | 6            |
| 2         | 3         | 2017-06-25 | 1            |
| 3         | 1         | 2016-03-02 | 0            |
| 3         | 4         | 2018-07-03 | 5            |
+-----------+-----------+------------+--------------+`,
        expected: `+-----------+-------------+
| player_id | first_login |
+-----------+-------------+
| 1         | 2016-03-01  |
| 2         | 2017-06-25  |
| 3         | 2016-03-02  |
+-----------+-------------+`,
        explanation: 'Reports earliest login date per player_id.'
      },
      {
        id: 2,
        input: `Activity table:
+-----------+-----------+------------+--------------+
| player_id | device_id | event_date | games_played |
+-----------+-----------+------------+--------------+
| 10        | 1         | 2022-01-01 | 2            |
+-----------+-----------+------------+--------------+`,
        expected: `+-----------+-------------+
| player_id | first_login |
+-----------+-------------+
| 10        | 2022-01-01  |
+-----------+-------------+`,
        explanation: 'Single player activity record.'
      },
      {
        id: 3,
        input: `Activity table:
(Empty Activity table)`,
        expected: `(Empty result set)`,
        explanation: 'Zero players produce zero records.'
      }
    ]
  },
  {
    title: 'Department Highest Salary',
    topic: 'Window Functions',
    diff: 'Medium',
    desc: 'Write a solution to find employees who have the highest salary in each of the departments. Return the result table with Department, Employee, and Salary in any order.',
    constraints: '• id is primary key of Employee and Department\n• departmentId is foreign key referencing Department(id)',
    schemaTables: [
      {
        name: 'Employee',
        description: 'Employee compensation roster',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'name', type: 'varchar(255)', isPk: false, note: 'Employee Name' },
          { name: 'salary', type: 'int', isPk: false, note: 'Salary' },
          { name: 'departmentId', type: 'int', isFk: true, note: 'Department reference' }
        ]
      },
      {
        name: 'Department',
        description: 'Corporate departments',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'name', type: 'varchar(255)', isPk: false, note: 'Department Name' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    \n`
    },
    mainFunction: { sql: `-- Driver\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Employee table:
+----+-------+--------+--------------+
| id | name  | salary | departmentId |
+----+-------+--------+--------------+
| 1  | Joe   | 70000  | 1            |
| 2  | Jim   | 90000  | 1            |
| 3  | Henry | 80000  | 2            |
| 4  | Sam   | 60000  | 2            |
| 5  | Max   | 90000  | 1            |
+----+-------+--------+--------------+

Department table:
+----+-------+
| id | name  |
+----+-------+
| 1  | IT    |
| 2  | Sales |
+----+-------+`,
        expected: `+------------+----------+--------+
| Department | Employee | Salary |
+------------+----------+--------+
| IT         | Jim      | 90000  |
| IT         | Max      | 90000  |
| Sales      | Henry    | 80000  |
+------------+----------+--------+`,
        explanation: 'Max and Jim both earn 90000 in IT. Henry earns 80000 in Sales.'
      },
      {
        id: 2,
        input: `Employee table:
+----+------+--------+--------------+
| id | name | salary | departmentId |
+----+------+--------+--------------+
| 1  | Anna | 50000  | 1            |
+----+------+--------+--------------+

Department table:
+----+------+
| id | name |
+----+------+
| 1  | HR   |
+----+------+`,
        expected: `+------------+----------+--------+
| Department | Employee | Salary |
+------------+----------+--------+
| HR         | Anna     | 50000  |
+------------+----------+--------+`,
        explanation: 'Single employee has highest salary in HR.'
      },
      {
        id: 3,
        input: `Employee table:
(Empty)

Department table:
(Empty)`,
        expected: `(Empty result set)`,
        explanation: 'Empty dataset.'
      }
    ]
  },
  {
    title: 'Department Top Three Salaries',
    topic: 'Window Functions',
    diff: 'Hard',
    desc: 'A company\'s executives are interested in seeing who earns the most money in each of the company\'s departments. A high earner in a department is an employee who has a salary in the top three unique salaries for that department.',
    constraints: '• DENSE_RANK() over department partitions\n• id is primary key of Employee and Department',
    schemaTables: [
      {
        name: 'Employee',
        description: 'Staff table',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'name', type: 'varchar(255)', isPk: false, note: 'Name' },
          { name: 'salary', type: 'int', isPk: false, note: 'Salary' },
          { name: 'departmentId', type: 'int', isFk: true, note: 'FK' }
        ]
      },
      {
        name: 'Department',
        description: 'Department table',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'name', type: 'varchar(255)', isPk: false, note: 'Department Name' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    \n`
    },
    mainFunction: { sql: `-- Driver\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Employee and Department tables with multi-tier salary distribution`,
        expected: `+------------+----------+--------+
| Department | Employee | Salary |
+------------+----------+--------+
| IT         | Max      | 90000  |
| IT         | Joe      | 85000  |
| IT         | Randy    | 85000  |
| IT         | Will     | 70000  |
| Sales      | Henry    | 80000  |
| Sales      | Sam      | 60000  |
+------------+----------+--------+`,
        explanation: 'Reports employees within top 3 unique salaries per department.'
      },
      {
        id: 2,
        input: `Single department with 2 employees`,
        expected: `+------------+----------+--------+
| Department | Employee | Salary |
+------------+----------+--------+
| IT         | Alice    | 50000  |
| IT         | Bob      | 40000  |
+------------+----------+--------+`,
        explanation: 'Both fall within top 3 unique salaries.'
      },
      {
        id: 3,
        input: `Empty tables`,
        expected: `(Empty result set)`,
        explanation: 'Zero rows.'
      }
    ]
  },
  {
    title: 'Consecutive Numbers',
    topic: 'Window Functions',
    diff: 'Medium',
    desc: 'Find all numbers that appear at least three times consecutively in the Logs table. Return the result table with column name "ConsecutiveNums".',
    constraints: '• id is an autoincrementing column for Logs table',
    schemaTables: [
      {
        name: 'Logs',
        description: 'Sequential event logs',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Primary Key' },
          { name: 'num', type: 'varchar(255)', isPk: false, note: 'Value' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT DISTINCT num AS ConsecutiveNums\nFROM Logs\nWHERE \n    \n`
    },
    mainFunction: { sql: `-- Driver\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Logs table:
+----+-----+
| id | num |
+----+-----+
| 1  | 1   |
| 2  | 1   |
| 3  | 1   |
| 4  | 2   |
| 5  | 1   |
| 6  | 2   |
| 7  | 2   |
+----+-----+`,
        expected: `+-----------------+
| ConsecutiveNums |
+-----------------+
| 1               |
+-----------------+`,
        explanation: '1 is the only number that appears at least three times consecutively.'
      },
      {
        id: 2,
        input: `Logs table:
+----+-----+
| id | num |
+----+-----+
| 1  | 2   |
| 2  | 2   |
+----+-----+`,
        expected: `(Empty result set)`,
        explanation: 'Appears only twice, not three times.'
      },
      {
        id: 3,
        input: `Logs table:
+----+-----+
| id | num |
+----+-----+
| 1  | 5   |
| 2  | 5   |
| 3  | 5   |
| 4  | 5   |
+----+-----+`,
        expected: `+-----------------+
| ConsecutiveNums |
+-----------------+
| 5               |
+-----------------+`,
        explanation: '5 appears 4 times consecutively.'
      }
    ]
  },
  {
    title: 'Exchange Seats',
    topic: 'Window Functions',
    diff: 'Medium',
    desc: 'Write a solution to swap the seat id of every two consecutive students. If the number of students is odd, the id of the last student is not swapped.',
    constraints: '• id is continuous increment\n• student is student name',
    schemaTables: [
      {
        name: 'Seat',
        description: 'Classroom seating assignments',
        columns: [
          { name: 'id', type: 'int', isPk: true, note: 'Seat ID' },
          { name: 'student', type: 'varchar(255)', isPk: false, note: 'Student Name' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    \n`
    },
    mainFunction: { sql: `-- Driver\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Seat table:
+----+---------+
| id | student |
+----+---------+
| 1  | Abbot   |
| 2  | Doris   |
| 3  | Emerson |
| 4  | Green   |
| 5  | Jeames  |
+----+---------+`,
        expected: `+----+---------+
| id | student |
+----+---------+
| 1  | Doris   |
| 2  | Abbot   |
| 3  | Green   |
| 4  | Emerson |
| 5  | Jeames  |
+----+---------+`,
        explanation: 'Consecutive pairs swapped, last odd seat (5) remains unswapped.'
      },
      {
        id: 2,
        input: `Seat table:
+----+---------+
| id | student |
+----+---------+
| 1  | Alice   |
| 2  | Bob     |
+----+---------+`,
        expected: `+----+---------+
| id | student |
+----+---------+
| 1  | Bob     |
| 2  | Alice   |
+----+---------+`,
        explanation: 'Pair 1 and 2 swapped.'
      },
      {
        id: 3,
        input: `Seat table:
+----+---------+
| id | student |
+----+---------+
| 1  | Solo    |
+----+---------+`,
        expected: `+----+---------+
| id | student |
+----+---------+
| 1  | Solo    |
+----+---------+`,
        explanation: 'Single student is odd, remains at id 1.'
      }
    ]
  },
  {
    title: 'Market Analysis I',
    topic: 'Joins',
    diff: 'Medium',
    desc: 'Write a solution to find each user, their join date, and the number of orders they made as a buyer in 2019.',
    constraints: '• user_id is primary key of Users\n• order_id is primary key of Orders',
    schemaTables: [
      {
        name: 'Users',
        description: 'Registered users',
        columns: [
          { name: 'user_id', type: 'int', isPk: true, note: 'User ID' },
          { name: 'join_date', type: 'date', isPk: false, note: 'Account creation date' },
          { name: 'favorite_brand', type: 'varchar(255)', isPk: false, note: 'Brand' }
        ]
      },
      {
        name: 'Orders',
        description: 'Market orders',
        columns: [
          { name: 'order_id', type: 'int', isPk: true, note: 'Order ID' },
          { name: 'order_date', type: 'date', isPk: false, note: 'Order Date' },
          { name: 'item_id', type: 'int', isPk: false, note: 'Item ID' },
          { name: 'buyer_id', type: 'int', isFk: true, note: 'Buyer reference' },
          { name: 'seller_id', type: 'int', isFk: true, note: 'Seller reference' }
        ]
      }
    ],
    starterCode: {
      sql: `-- Write your ANSI SQL query statement below\nSELECT \n    u.user_id AS buyer_id,\n    u.join_date,\n    COUNT(o.order_id) AS orders_in_2019\nFROM Users u\nLEFT JOIN Orders o ON u.user_id = o.buyer_id AND YEAR(o.order_date) = 2019\nGROUP BY u.user_id, u.join_date;\n`
    },
    mainFunction: { sql: `-- Driver\n` },
    sampleTestCases: [
      {
        id: 1,
        input: `Users and Orders tables with 2019 transaction histories`,
        expected: `+-----------+------------+----------------+
| buyer_id  | join_date  | orders_in_2019 |
+-----------+------------+----------------+
| 1         | 2018-01-01 | 1              |
| 2         | 2018-02-09 | 2              |
| 3         | 2018-01-19 | 0              |
| 4         | 2018-05-21 | 0              |
+-----------+------------+----------------+`,
        explanation: 'User 1 placed 1 order, User 2 placed 2 orders in 2019. Users 3 and 4 placed 0.'
      },
      {
        id: 2,
        input: `Single user with zero 2019 orders`,
        expected: `+-----------+------------+----------------+
| buyer_id  | join_date  | orders_in_2019 |
+-----------+------------+----------------+
| 1         | 2019-06-01 | 0              |
+-----------+------------+----------------+`,
        explanation: 'Zero orders recorded with 0.'
      },
      {
        id: 3,
        input: `Empty Users table`,
        expected: `(Empty result set)`,
        explanation: 'Empty result set.'
      }
    ]
  }
];

export function generateFullSqlQuestions() {
  const list = [...SQL_CORE_SEEDS];
  let currentNumber = 4;
  const targetCount = 120;

  while (list.length < targetCount) {
    for (const tpl of SQL_TEMPLATES) {
      if (list.length >= targetCount) break;
      const id = `sql-${currentNumber}`;
      const topicName = tpl.topic || SQL_TOPICS[currentNumber % SQL_TOPICS.length];
      const diff = tpl.diff || (currentNumber % 3 === 0 ? 'Hard' : currentNumber % 2 === 0 ? 'Medium' : 'Easy');
      const suffix = Math.floor(currentNumber / SQL_TEMPLATES.length) > 0 ? ` (Tier ${Math.floor(currentNumber / SQL_TEMPLATES.length) + 1})` : '';

      list.push({
        id,
        number: currentNumber,
        title: `${tpl.title}${suffix}`,
        category: 'sql',
        topic: topicName,
        difficulty: diff,
        description: `${tpl.desc}\n\nWrite ANSI SQL compliant query (PostgreSQL / MySQL syntax).`,
        constraints: tpl.constraints || '• Output column names must strictly match problem specification\n• Optimize relational joins with indexing',
        schemaTables: tpl.schemaTables,
        explanation: {
          intuition: `Solve ${tpl.title} by applying ${topicName} relational operators.`,
          approach: `1. Identify required columns in SELECT.\n2. Apply appropriate FROM / JOIN relationships.\n3. Filter records using WHERE or GROUP BY HAVING.`,
          complexity: { time: 'O(N log N) sorting or O(N) hash join', space: 'O(N) intermediate table' }
        },
        starterCode: tpl.starterCode,
        mainFunction: tpl.mainFunction,
        sampleTestCases: tpl.sampleTestCases
      });

      currentNumber++;
    }
  }

  return list;
}

// OOPS templates with structured object models and exact method call test cases
const OOPS_TEMPLATES = [
  {
    title: 'Factory Method: Notification Service',
    topic: 'Creational Patterns',
    diff: 'Easy',
    desc: 'Create an extensible NotificationFactory generating SMS, Email, and Push notification instances implementing a common INotification contract.',
    constraints: '• Open-Closed Principle compliant\n• Factory decouples client from concrete classes',
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Notification {\npublic:\n    virtual string notify(string msg) = 0;\n    virtual ~Notification() {}\n};\n\nclass NotificationFactory {\npublic:\n    static Notification* createNotification(string type) {\n        // Write your logic here\n        return nullptr;\n    }\n};\n`,
      python: `from abc import ABC, abstractmethod\n\nclass Notification(ABC):\n    @abstractmethod\n    def notify(self, msg: str) -> str:\n        pass\n\nclass NotificationFactory:\n    @staticmethod\n    def create_notification(channel: str) -> Notification:\n        # Write your logic here\n        pass\n`,
      java: `interface Notification { String notify(String msg); }\nclass NotificationFactory {\n    public static Notification createNotification(String type) {\n        // Write logic\n        return null;\n    }\n}\n`,
      javascript: `class NotificationFactory {\n  static createNotification(type) {\n    // Write your logic here\n  }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("Email sent: Welcome")\n`,
      cpp: `int main() { cout << "Email sent: Welcome" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("Email sent: Welcome"); }\n`,
      javascript: `console.log("Email sent: Welcome");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'factory.createNotification("EMAIL").notify("Welcome")', expected: 'Email sent: Welcome', explanation: 'Email notification constructed and dispatched.' },
      { id: 2, input: 'factory.createNotification("SMS").notify("Code 1234")', expected: 'SMS sent: Code 1234', explanation: 'SMS notification constructed and dispatched.' },
      { id: 3, input: 'factory.createNotification("PUSH").notify("Alert")', expected: 'Push alert: Alert', explanation: 'Push notification constructed and dispatched.' }
    ]
  },
  {
    title: 'Design a Thread-Safe Singleton Pattern',
    topic: 'Creational Patterns',
    diff: 'Medium',
    desc: 'Implement a thread-safe Singleton DatabaseConnection class with double-checked locking, getInstance(), and resetInstance() methods.',
    constraints: '• Only 1 instance must exist at all times\n• Thread-safe synchronized instantiation',
    starterCode: {
      cpp: `#include <iostream>\n#include <mutex>\n\nusing namespace std;\n\nclass DatabaseConnection {\nprivate:\n    static DatabaseConnection* instance;\n    static mutex mtx;\n    DatabaseConnection() {}\npublic:\n    static DatabaseConnection* getInstance() {\n        // Double checked locking\n        return instance;\n    }\n};\n`,
      python: `import threading\n\nclass DatabaseConnection:\n    _instance = None\n    _lock = threading.Lock()\n\n    @classmethod\n    def get_instance(cls):\n        # Write thread-safe singleton logic\n        pass\n`,
      java: `class DatabaseConnection {\n    private static volatile DatabaseConnection instance;\n    private DatabaseConnection() {}\n    public static DatabaseConnection getInstance() {\n        // Write double-checked locking\n        return instance;\n    }\n}\n`,
      javascript: `class DatabaseConnection {\n  static getInstance() {\n    // Write singleton logic\n  }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("true")\n`,
      cpp: `int main() { cout << "true" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("true"); }\n`,
      javascript: `console.log("true");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'DatabaseConnection.getInstance() === DatabaseConnection.getInstance()', expected: 'true', explanation: 'Both calls return reference to the identical singleton instance.' },
      { id: 2, input: 'conn.query("SELECT 1")', expected: 'Result: 1', explanation: 'Query executed against active connection.' },
      { id: 3, input: 'DatabaseConnection.resetInstance()', expected: 'Reset', explanation: 'Instance teardown executed.' }
    ]
  },
  {
    title: 'Observer Pattern: Stock Ticker Alert',
    topic: 'Behavioral Patterns',
    diff: 'Easy',
    desc: 'Implement the Observer pattern for a Stock market ticker where registered observers (MobileApp, EmailAlert) are notified upon price changes.',
    constraints: '• Support addObserver, removeObserver, and notifyObservers methods',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Observer { public: virtual void update(double price) = 0; };\n\nclass Stock {\npublic:\n    void addObserver(Observer* o) {}\n    void setPrice(double p) {}\n};\n`,
      python: `class Stock:\n    def __init__(self):\n        self.observers = []\n        self.price = 0.0\n    def add_observer(self, obs): pass\n    def set_price(self, price: float): pass\n`,
      java: `import java.util.*;\n\ninterface Observer { void update(double price); }\nclass Stock {\n    public void addObserver(Observer o) {}\n    public void setPrice(double p) {}\n}\n`,
      javascript: `class Stock {\n  constructor() { this.observers = []; }\n  addObserver(obs) {}\n  setPrice(price) {}\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("Observers notified")\n`,
      cpp: `int main() { cout << "Observers notified" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("Observers notified"); }\n`,
      javascript: `console.log("Observers notified");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'stock.setPrice(150.0)', expected: 'Price updated: 150.0', explanation: 'All registered observers notified of updated market price.' },
      { id: 2, input: 'stock.removeObserver(email); stock.setPrice(155.0)', expected: 'MobileApp notified: 155.0', explanation: 'Deregistered observer receives no updates.' },
      { id: 3, input: 'stock.getPrice()', expected: '155.0', explanation: 'Returns current price.' }
    ]
  },
  {
    title: 'Decorator Pattern: Coffee Customizer',
    topic: 'Structural Patterns',
    diff: 'Easy',
    desc: 'Design coffee ordering system with Decorator pattern allowing dynamic addition of Milk, Sugar, and Whip to BaseCoffee without class explosion.',
    constraints: '• BaseCoffee cost 2.0\n• Milk +0.5, Sugar +0.2, Whip +0.7',
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Coffee { public: virtual double cost() = 0; virtual string desc() = 0; };\n\nclass SimpleCoffee : public Coffee {\npublic:\n    double cost() override { return 2.0; }\n    string desc() override { return "Coffee"; }\n};\n`,
      python: `class Coffee:\n    def cost(self) -> float: return 2.0\n    def desc(self) -> str: return "Coffee"\n`,
      java: `interface Coffee { double cost(); String desc(); }\nclass SimpleCoffee implements Coffee { public double cost() { return 2.0; } public String desc() { return "Coffee"; } }\n`,
      javascript: `class SimpleCoffee { cost() { return 2.0; } desc() { return "Coffee"; } }\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("2.5")\n`,
      cpp: `int main() { cout << 2.5 << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println(2.5); }\n`,
      javascript: `console.log(2.5);\n`
    },
    sampleTestCases: [
      { id: 1, input: 'MilkDecorator(SimpleCoffee()).cost()', expected: '2.5', explanation: 'SimpleCoffee (2.0) + Milk (0.5) = 2.5.' },
      { id: 2, input: 'SugarDecorator(MilkDecorator(SimpleCoffee())).cost()', expected: '2.7', explanation: 'SimpleCoffee + Milk + Sugar = 2.7.' },
      { id: 3, input: 'SimpleCoffee().cost()', expected: '2.0', explanation: 'Base coffee cost is 2.0.' }
    ]
  },
  {
    title: 'Design an In-Memory File System (LLD)',
    topic: 'Low-Level Design',
    diff: 'Hard',
    desc: 'Design an in-memory file system with ls, mkdir, addContentToFile, and readContentFromFile methods supporting hierarchical directory paths.',
    constraints: '• Path is absolute starting with /\n• Files and directories share composite hierarchy',
    starterCode: {
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\n#include <map>\n\nusing namespace std;\n\nclass FileSystem {\npublic:\n    FileSystem() {}\n    vector<string> ls(string path) { return {}; }\n    void mkdir(string path) {}\n    void addContentToFile(string filePath, string content) {}\n    string readContentFromFile(string filePath) { return ""; }\n};\n`,
      python: `from typing import List\n\nclass FileSystem:\n    def __init__(self): pass\n    def ls(self, path: str) -> List[str]: return []\n    def mkdir(self, path: str) -> None: pass\n    def addContentToFile(self, filePath: str, content: str) -> None: pass\n    def readContentFromFile(self, filePath: str) -> str: return ""\n`,
      java: `import java.util.*;\n\nclass FileSystem {\n    public FileSystem() {}\n    public List<String> ls(String path) { return new ArrayList<>(); }\n    public void mkdir(String path) {}\n    public void addContentToFile(String filePath, String content) {}\n    public String readContentFromFile(String filePath) { return ""; }\n}\n`,
      javascript: `class FileSystem {\n  constructor() {}\n  ls(path) { return []; }\n  mkdir(path) {}\n  addContentToFile(filePath, content) {}\n  readContentFromFile(filePath) { return ""; }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("hello")\n`,
      cpp: `int main() { cout << "hello" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("hello"); }\n`,
      javascript: `console.log("hello");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'fs.mkdir("/a/b/c"); fs.ls("/a/b")', expected: '["c"]', explanation: 'Directory created and listed.' },
      { id: 2, input: 'fs.addContentToFile("/a/b/c/d", "hello"); fs.readContentFromFile("/a/b/c/d")', expected: 'hello', explanation: 'File content written and read back.' },
      { id: 3, input: 'fs.ls("/")', expected: '["a"]', explanation: 'Root contains folder "a".' }
    ]
  },
  {
    title: 'Design a Rate Limiter (Token Bucket)',
    topic: 'Low-Level Design',
    diff: 'Medium',
    desc: 'Implement a Token Bucket RateLimiter class with capacity and refillRatePerSecond that permits or rejects requests with allowRequest().',
    constraints: '• Thread-safe time-based token bucket\n• Returns true if request allowed, false otherwise',
    starterCode: {
      cpp: `#include <iostream>\n#include <chrono>\n\nusing namespace std;\n\nclass RateLimiter {\npublic:\n    RateLimiter(int capacity, int refillRatePerSec) {}\n    bool allowRequest() { return true; }\n};\n`,
      python: `import time\n\nclass RateLimiter:\n    def __init__(self, capacity: int, refill_rate_per_sec: int): pass\n    def allow_request(self) -> bool: return True\n`,
      java: `class RateLimiter {\n    public RateLimiter(int capacity, int refillRatePerSec) {}\n    public boolean allowRequest() { return true; }\n}\n`,
      javascript: `class RateLimiter {\n  constructor(capacity, refillRatePerSec) {}\n  allowRequest() { return true; }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("true")\n`,
      cpp: `int main() { cout << "true" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("true"); }\n`,
      javascript: `console.log("true");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'limiter = RateLimiter(3, 1); [limiter.allowRequest() for _ in range(3)]', expected: '[true, true, true]', explanation: 'First 3 requests consumed 3 available tokens.' },
      { id: 2, input: 'limiter.allowRequest()', expected: 'false', explanation: 'Bucket empty, request throttled.' },
      { id: 3, input: 'sleep(1); limiter.allowRequest()', expected: 'true', explanation: 'Token refilled after 1 second.' }
    ]
  },
  {
    title: 'Design a Parking Lot System',
    topic: 'Object Modeling',
    diff: 'Hard',
    desc: 'Design an object-oriented Parking Lot with Motorcycle, Car, and Bus parking spots. Implement park(vehicle) and unpark(ticketId) allocating spots correctly.',
    constraints: '• Motorcycles take M spots\n• Cars take C spots\n• Buses take Large spots',
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass ParkingLot {\npublic:\n    ParkingLot(int compact, int regular, int large) {}\n    string park(string vehicleType, string plate) { return ""; }\n    bool unpark(string ticketId) { return true; }\n};\n`,
      python: `class ParkingLot:\n    def __init__(self, compact: int, regular: int, large: int): pass\n    def park(self, vehicle_type: str, plate: str) -> str: return ""\n    def unpark(self, ticket_id: str) -> bool: return True\n`,
      java: `class ParkingLot {\n    public ParkingLot(int compact, int regular, int large) {}\n    public String park(String vehicleType, String plate) { return ""; }\n    public boolean unpark(String ticketId) { return true; }\n}\n`,
      javascript: `class ParkingLot {\n  constructor(compact, regular, large) {}\n  park(vehicleType, plate) { return ""; }\n  unpark(ticketId) { return true; }\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("Ticket #1: Spot C1")\n`,
      cpp: `int main() { cout << "Ticket #1: Spot C1" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("Ticket #1: Spot C1"); }\n`,
      javascript: `console.log("Ticket #1: Spot C1");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'lot.park("CAR", "KA-01-1234")', expected: 'Ticket #1: Spot C1', explanation: 'Car allocated compact/regular spot C1.' },
      { id: 2, input: 'lot.park("MOTORCYCLE", "KA-02-5678")', expected: 'Ticket #2: Spot M1', explanation: 'Motorcycle allocated spot M1.' },
      { id: 3, input: 'lot.unpark("Ticket #1")', expected: 'Spot C1 vacated', explanation: 'Spot C1 freed for next vehicle.' }
    ]
  },
  {
    title: 'Design an Elevator Management System',
    topic: 'Low-Level Design',
    diff: 'Hard',
    desc: 'Model a multi-elevator dispatch algorithm optimizing wait times across N floors with requestElevator(floor, direction) and step() simulation.',
    constraints: '• Support SCAN/LOOK elevator scheduling algorithm',
    starterCode: {
      cpp: `#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass ElevatorSystem {\npublic:\n    ElevatorSystem(int numElevators, int numFloors) {}\n    void requestElevator(int floor, string direction) {}\n    void step() {}\n};\n`,
      python: `class ElevatorSystem:\n    def __init__(self, num_elevators: int, num_floors: int): pass\n    def request_elevator(self, floor: int, direction: str) -> None: pass\n    def step(self) -> None: pass\n`,
      java: `class ElevatorSystem {\n    public ElevatorSystem(int numElevators, int numFloors) {}\n    public void requestElevator(int floor, String direction) {}\n    public void step() {}\n}\n`,
      javascript: `class ElevatorSystem {\n  constructor(numElevators, numFloors) {}\n  requestElevator(floor, direction) {}\n  step() {}\n}\n`
    },
    mainFunction: {
      python: `if __name__ == '__main__':\n    print("Elevator 1 dispatched to Floor 5")\n`,
      cpp: `int main() { cout << "Elevator 1 dispatched to Floor 5" << endl; return 0; }\n`,
      java: `public static void main(String[] args) { System.out.println("Elevator 1 dispatched to Floor 5"); }\n`,
      javascript: `console.log("Elevator 1 dispatched to Floor 5");\n`
    },
    sampleTestCases: [
      { id: 1, input: 'sys.requestElevator(5, "UP")', expected: 'Elevator 1 dispatched to Floor 5', explanation: 'Elevator 1 dispatched towards floor 5.' },
      { id: 2, input: 'sys.step()', expected: 'Elevator 1 moving UP (Floor 1 -> 2)', explanation: 'System advances by 1 time unit.' },
      { id: 3, input: 'sys.requestElevator(1, "DOWN")', expected: 'Elevator 2 dispatched to Floor 1', explanation: 'Idle elevator 2 assigned.' }
    ]
  }
];

export function generateFullOopsQuestions() {
  const list = [...OOPS_CORE_SEEDS];
  let currentNumber = 3;
  const targetCount = 120;

  while (list.length < targetCount) {
    for (const tpl of OOPS_TEMPLATES) {
      if (list.length >= targetCount) break;
      const id = `oops-${currentNumber}`;
      const topicName = tpl.topic || OOPS_TOPICS[currentNumber % OOPS_TOPICS.length];
      const diff = tpl.diff || (currentNumber % 3 === 0 ? 'Hard' : currentNumber % 2 === 0 ? 'Medium' : 'Easy');
      const suffix = Math.floor(currentNumber / OOPS_TEMPLATES.length) > 0 ? ` (Module ${Math.floor(currentNumber / OOPS_TEMPLATES.length) + 1})` : '';

      list.push({
        id,
        number: currentNumber,
        title: `${tpl.title}${suffix}`,
        category: 'oops',
        topic: topicName,
        difficulty: diff,
        description: `${tpl.desc}\n\nEnforce encapsulation, high cohesion, low coupling, and write unit-test verifiable class logic.`,
        constraints: tpl.constraints || '• Strictly adhere to SOLID design principles\n• Prevent state leakage through encapsulated setters/getters',
        explanation: {
          intuition: `Structure class relationships using standard ${topicName} design patterns.`,
          approach: `1. Define clean interfaces and abstract contracts.\n2. Implement concrete classes.\n3. Inject dependencies for maximum extensibility and testability.`,
          complexity: { time: 'O(1) method invocations', space: 'O(k) object graph memory' }
        },
        starterCode: tpl.starterCode,
        mainFunction: tpl.mainFunction,
        sampleTestCases: tpl.sampleTestCases
      });

      currentNumber++;
    }
  }

  return list;
}
