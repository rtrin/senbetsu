---
name: debugging
description: Unstick AI from debugging loops using log-based feedback
---

# Debugging Workflow

When AI gets stuck in loops on deep technical issues, use this pattern to unstick it.

## The Problem

AI sometimes goes in circles on complex bugs because it:

- Can't see runtime behavior
- Makes assumptions about state
- Tries the same fix repeatedly

## The Solution: Log-Based Debugging

### Step 1: Request Logs

When stuck, tell the AI:

```
Add console.log/print statements to trace:
1. Function entry/exit points
2. Key variable values
3. Conditional branch taken
4. External API responses
```

### Step 2: Run the Scenario

Execute the failing case:

```bash
npm run dev  # or however you run
# Trigger the bug
```

### Step 3: Share Output

Copy the log output and share it:

```
Here's the log output when I reproduce the bug:

[paste logs]

What do you see? What's the actual vs expected behavior?
```

### Step 4: Iterate

AI can now:

- See actual runtime values
- Identify where behavior diverges
- Propose targeted fixes

## Example Interaction

**You:** This function keeps returning undefined but it should return the user object.

**AI (stuck):** Let me check the return statement... [tries same fix again]

**You (using this pattern):**

```
Add logging to trace the flow:
- Log when function starts
- Log the database query result
- Log before the return

Then I'll run it and share the output.
```

**AI:** Added logs:

```javascript
function getUser(id) {
  console.log('getUser called with:', id);
  const user = db.query(`SELECT * FROM users WHERE id = ?`, id);
  console.log('Query result:', user);
  console.log('Returning:', user[0]);
  return user[0];
}
```

**You:** Output:

```
getUser called with: 123
Query result: []
Returning: undefined
```

**AI:** The query returns an empty array - the user doesn't exist in the database. We need to check if the user exists first...

## Pro Tips

### Structured Logging

```javascript
console.log(JSON.stringify({ event: 'getUserStart', id, timestamp: Date.now() }));
```

### Conditional Logging

```javascript
if (process.env.DEBUG) console.log('Debug:', data);
```

### Remove After Fixing

```
Remove the debug logging we added, keeping only:
- Error-level logs that should stay
- Any logging that's useful long-term
```

## When to Use This

- AI has tried 2+ fixes without progress
- Bug involves async behavior
- Bug involves external services
- State is unpredictable

## Integration

Use when:

- `/feature-development` implementation gets stuck
- Code review finds unclear bugs
- Pre-commit fails mysteriously
