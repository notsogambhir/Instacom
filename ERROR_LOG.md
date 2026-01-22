# Error & Issue Log

**Project:** InstaCom  
**Managed By:** Antigravity

| Date | ID | Error Description | Root Cause | Solution/Fix |
| :--- | :--- | :--- | :--- | :--- |
| 2026-01-21 | ERR-001 | `mkdir` command failed with `InvalidArgument` | PowerShell `mkdir` (alias for `New-Item`) does not support multiple path arguments separated by spaces without commas or explicit array syntax in the tool wrapper. | **Fix:** Executed `mkdir` commands sequentially or used proper PowerShell array syntax. |
