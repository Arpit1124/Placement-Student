import { DsaProblem } from '../types';

export const DSA_TOPICS = [
  'All Topics',
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stacks & Queues',
  'Trees & BST',
  'Graphs',
  'Sorting & Searching',
  'Dynamic Programming',
] as const;

export const DSA_PROBLEMS: DsaProblem[] = [
  {
    id: 'arr-1',
    title: 'Two Sum & Target Pair Finding',
    topic: 'Arrays',
    difficulty: 'Easy',
    popularCompanies: ['TCS Digital', 'Infosys DSE', 'Amazon', 'Wipro Turbo'],
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    hints: [
      'A brute force O(N^2) checks every pair.',
      'Can you use a Hash Map to store seen elements and look up (target - nums[i]) in O(1) time?',
    ],
    starterCode: {
      cpp: `// Language: C++
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
    return {};
}`,
      java: `// Language: Java
import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}`,
      python: `# Language: Python
def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your code here
    pass`,
      javascript: `// Language: JavaScript
function twoSum(nums, target) {
    // Write your code here
    return [];
}`,
    },
  },
  {
    id: 'arr-2',
    title: 'Maximum Subarray (Kadane’s Algorithm)',
    topic: 'Arrays',
    difficulty: 'Medium',
    popularCompanies: ['Amazon', 'Flipkart', 'Accenture', 'Cognizant GenC'],
    description:
      'Given an integer array nums, find the subarray with the largest sum, and return its sum. The subarray must contain at least one element.',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    hints: [
      'Try Kadane’s algorithm: keep track of currentSum and maxSum.',
      'If currentSum becomes negative, reset it to 0.',
    ],
    starterCode: {
      cpp: `int maxSubArray(vector<int>& nums) {\n    // Kadane's algorithm\n    return 0;\n}`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}`,
      python: `def maxSubArray(nums: list[int]) -> int:\n    pass`,
      javascript: `function maxSubArray(nums) {\n    return 0;\n}`,
    },
  },
  {
    id: 'str-1',
    title: 'Valid Palindrome & Alphanumeric Cleaning',
    topic: 'Strings',
    difficulty: 'Easy',
    popularCompanies: ['TCS Ninja', 'Wipro Elite', 'Capgemini'],
    description:
      'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.',
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5'],
    hints: ['Use two pointers: one starting at the beginning, one at the end.'],
    starterCode: {
      cpp: `bool isPalindrome(string s) {\n    return true;\n}`,
      java: `public boolean isPalindrome(String s) {\n    return true;\n}`,
      python: `def isPalindrome(s: str) -> bool:\n    pass`,
      javascript: `function isPalindrome(s) {\n    return true;\n}`,
    },
  },
  {
    id: 'str-2',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    difficulty: 'Medium',
    popularCompanies: ['Amazon', 'Google', 'Microsoft', 'Paytm'],
    description:
      'Given a string s, find the length of the longest substring without duplicate characters.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4'],
    hints: ['Use the Sliding Window technique with a hash set or frequency map.'],
    starterCode: {
      cpp: `int lengthOfLongestSubstring(string s) {\n    return 0;\n}`,
      java: `public int lengthOfLongestSubstring(String s) {\n    return 0;\n}`,
      python: `def lengthOfLongestSubstring(s: str) -> int:\n    pass`,
      javascript: `function lengthOfLongestSubstring(s) {\n    return 0;\n}`,
    },
  },
  {
    id: 'll-1',
    title: 'Reverse a Singly Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    popularCompanies: ['Infosys', 'Wipro', 'TCS', 'HCL'],
    description:
      'Given the head of a singly linked list, reverse the list, and return the reversed list. Can you do it iteratively and recursively?',
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
      },
    ],
    constraints: ['The number of nodes is in [0, 5000].', '-5000 <= Node.val <= 5000'],
    hints: ['Maintain three pointers: prev, curr, and next.'],
    starterCode: {
      cpp: `ListNode* reverseList(ListNode* head) {\n    ListNode* prev = nullptr;\n    return prev;\n}`,
      java: `public ListNode reverseList(ListNode head) {\n    return null;\n}`,
      python: `def reverseList(head):\n    pass`,
      javascript: `function reverseList(head) {\n    return null;\n}`,
    },
  },
  {
    id: 'sq-1',
    title: 'Valid Parentheses & Bracket Matching',
    topic: 'Stacks & Queues',
    difficulty: 'Easy',
    popularCompanies: ['Accenture', 'Tech Mahindra', 'Amazon', 'Adobe'],
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets and in the correct order.',
    examples: [
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      },
    ],
    constraints: ['1 <= s.length <= 10^4'],
    hints: ['Push opening brackets onto a stack; pop and verify match on closing bracket.'],
    starterCode: {
      cpp: `bool isValid(string s) {\n    return true;\n}`,
      java: `public boolean isValid(String s) {\n    return true;\n}`,
      python: `def isValid(s: str) -> bool:\n    pass`,
      javascript: `function isValid(s) {\n    return true;\n}`,
    },
  },
  {
    id: 'tree-1',
    title: 'Lowest Common Ancestor in a Binary Tree',
    topic: 'Trees & BST',
    difficulty: 'Medium',
    popularCompanies: ['Microsoft', 'Amazon', 'Flipkart', 'Samsung'],
    description:
      'Given a binary tree, find the lowest common ancestor (LCA) of two given nodes p and q in the tree. According to the definition of LCA on Wikipedia: "The lowest common ancestor is defined between two nodes p and q as the lowest node in T that has both p and q as descendants (where we allow a node to be a descendant of itself)."',
    examples: [
      {
        input: 'root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1',
        output: '3',
      },
    ],
    constraints: ['The number of nodes in the tree is in [2, 10^5].'],
    hints: ['Traverse the tree recursively. If left and right subtrees each return a node, current node is the LCA.'],
    starterCode: {
      cpp: `TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n    return nullptr;\n}`,
      java: `public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n    return null;\n}`,
      python: `def lowestCommonAncestor(root, p, q):\n    pass`,
      javascript: `function lowestCommonAncestor(root, p, q) {\n    return null;\n}`,
    },
  },
  {
    id: 'graph-1',
    title: 'Number of Connected Islands (BFS/DFS)',
    topic: 'Graphs',
    difficulty: 'Medium',
    popularCompanies: ['Amazon', 'Google', 'Uber', 'Swiggy'],
    description:
      'Given an m x n 2D binary grid grid which represents a map of "1"s (land) and "0"s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      {
        input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]',
        output: '2',
      },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    hints: ['Iterate through cells. When a 1 is hit, increment island count and trigger DFS/BFS to sink/mark the entire island.'],
    starterCode: {
      cpp: `int numIslands(vector<vector<char>>& grid) {\n    return 0;\n}`,
      java: `public int numIslands(char[][] grid) {\n    return 0;\n}`,
      python: `def numIslands(grid: list[list[str]]) -> int:\n    pass`,
      javascript: `function numIslands(grid) {\n    return 0;\n}`,
    },
  },
  {
    id: 'sort-1',
    title: 'Search in Rotated Sorted Array',
    topic: 'Sorting & Searching',
    difficulty: 'Medium',
    popularCompanies: ['Adobe', 'Amazon', 'Microsoft', 'TCS Digital'],
    description:
      'There is an integer array nums sorted in ascending order (with distinct values). Prior to being passed to your function, nums is possibly rotated at an unknown pivot index k. Given the array nums after the possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. You must write an algorithm with O(log n) runtime complexity.',
    examples: [
      {
        input: 'nums = [4,5,6,7,0,1,2], target = 0',
        output: '4',
      },
      {
        input: 'nums = [4,5,6,7,0,1,2], target = 3',
        output: '-1',
      },
    ],
    constraints: ['1 <= nums.length <= 5000', '-10^4 <= nums[i] <= 10^4', 'All values of nums are unique.'],
    hints: ['Modified Binary Search: in any rotated sorted array, at least one half (left or right) is guaranteed to be strictly sorted.'],
    starterCode: {
      cpp: `int search(vector<int>& nums, int target) {\n    return -1;\n}`,
      java: `public int search(int[] nums, int target) {\n    return -1;\n}`,
      python: `def search(nums: list[int], target: int) -> int:\n    pass`,
      javascript: `function search(nums, target) {\n    return -1;\n}`,
    },
  },
  {
    id: 'dp-1',
    title: '0/1 Knapsack & Dynamic Programming Optimization',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    popularCompanies: ['Amazon', 'Morgan Stanley', 'Goldman Sachs', 'Flipkart'],
    description:
      'Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value in the knapsack. You cannot break an item; either pick the complete item or do not pick it (0-1 property).',
    examples: [
      {
        input: 'W = 4, val = [1,2,3], wt = [4,5,1]',
        output: '3',
        explanation: 'Pick the 3rd item with weight 1 and value 3.',
      },
    ],
    constraints: ['1 <= n <= 1000', '1 <= W <= 1000'],
    hints: ['Formulate state: dp[i][w] = max value considering first i items with remaining weight w.'],
    starterCode: {
      cpp: `int knapSack(int W, vector<int>& wt, vector<int>& val) {\n    return 0;\n}`,
      java: `public int knapSack(int W, int[] wt, int[] val) {\n    return 0;\n}`,
      python: `def knapSack(W: int, wt: list[int], val: list[int]) -> int:\n    pass`,
      javascript: `function knapSack(W, wt, val) {\n    return 0;\n}`,
    },
  },
];
