## 1. Test evidence

- [x] 1.1 Record the failing `src/components/shell/shell.test.tsx` test `reaches sign-out from the keyboard and confirms before revoking`: hosted CI run 33092164295 cannot find the Sign out menu item after the click-shaped setup
- [x] 1.2 Replace the pointer click with focused Enter-key activation and verify the targeted shell test passes repeatedly

## 2. Delivery

- [x] 2.1 Run the complete Web gate and verify every command passes
- [ ] 2.2 Publish the correction to `main`, verify the exact hosted CI run passes, then archive the completed OpenSpec change
