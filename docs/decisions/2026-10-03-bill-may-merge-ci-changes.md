# Bill may merge CI changes

**Date:** 2026-10-03

**Question:**  
D1 said agents change CI only through PRs that Guy merges. Should CI PRs (e.g. N6, verify.yml) still wait for Guy?

**Decision:**  
"CI is not the product, he can do it." Bill may review and merge CI/workflow PRs (e.g. N6) himself once CI is green, the same as bug fixes, optimizations and maintenance.

**What it changes:**  
Replaces the D1 line "Agents change CI only through PRs that Guy merges". Agents still never push to main. New capabilities and design changes are still merged only by Guy.