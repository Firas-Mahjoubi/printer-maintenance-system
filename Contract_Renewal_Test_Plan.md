# Contract Renewal Functionality Test Plan

## Environment Setup ✅
- Backend: Running on http://localhost:8081
- Frontend: Running on http://localhost:4200
- Database: PostgreSQL with sample data initialized

## Sample Data Available ✅
### Active Contracts (available for renewal):
- CNT-2024-001 (expires 2024-12-31)
- CNT-2024-002 (expires 2025-01-31)
- CNT-2024-003 (expires 2025-05-31)
- CNT-2024-005 through CNT-2024-012 (various expiry dates)

### Already Renewed/Expired:
- CNT-2023-015 (EXPIRED)
- CNT-2024-004 (RENEWED)

## Test Scenarios

### 1. UI/UX Tests
- [ ] Verify "Renouveler Contrat" button is visible on contract details page
- [ ] Check renewal form displays when button is clicked
- [ ] Verify form fields are pre-filled with current contract data
- [ ] Test form validation for required fields
- [ ] Test date validation (end date > start date)

### 2. Functional Tests
- [ ] **Primary Test**: Renew an active contract (e.g., CNT-2024-001)
  - Access contract details page
  - Click "Renouveler Contrat" button
  - Fill in new contract details
  - Submit renewal form
  - Verify success message
  - Check redirection to new contract
  
- [ ] **Validation Tests**:
  - Try submitting with empty required fields
  - Try submitting with invalid date ranges
  - Test with special characters in contract number

### 3. Backend API Tests
- [ ] Verify old contract status changed to "RENOUVELE"
- [ ] Verify new contract created with "ACTIF" status
- [ ] Check that printers are transferred to new contract
- [ ] Verify contract precedent link is established

### 4. Edge Cases
- [ ] Test renewal of contract that's already expired
- [ ] Test renewal of contract that's already renewed
- [ ] Test concurrent renewal attempts

## Expected Results

### Successful Renewal Should:
1. Create new contract with unique number
2. Set old contract status to "RENOUVELE"
3. Set new contract status to "ACTIF"
4. Transfer all associated printers
5. Link new contract to previous one
6. Show success message and redirect
7. Display new contract details properly

### Failed Renewal Should:
1. Display appropriate error messages
2. Not modify any data
3. Keep form open for correction

## Test Execution Notes
- Start with contract CNT-2024-001 for primary testing
- Document any issues found
- Test both success and failure scenarios
- Verify database consistency after tests
