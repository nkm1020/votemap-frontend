# Profile Statistics Implementation Plan

## 1. Database Schema Updates
- [ ] Add `tags` column to `Topic` table (to store JSON tags for options)
- [ ] Add `cached_winner` logic or table (optional: for now we can compute on fly or use simple caching) -> *Decision: Compute on fly for MVP, optimize later if slow.*
- *Actually, sticking to the plan:* creating a caching mechanism is good. But let's verify if we can just edit the Topic entity first.

## 2. Backend Implementation (Auth/User Service)
- [ ] **Match Rate Calculation**:
    - Iterate user votes.
    - For each vote, query region majority (Count A vs B in that region).
    - Helper method: `getRegionWinner(topicId, region)`
- [ ] **Persona Logic**:
    - Based on match rate %, assign title.
    - Returns: `title`, `description`.
- [ ] **Tag Extraction**:
    - Need to update `Topic` entity to include tags for Option A and Option B.
    - Example structure: `tags: { A: ["tag1"], B: ["tag2"] }` (JSONB or simple text)
    - Calculate top 3 tags from user's vote history.
- [ ] **Comparison List**:
    - Return list with `isMatch` flag.

## 3. Frontend Integration
- [ ] Update `ProfilePage` to display real data instead of mocks.
- [ ] Remove hardcoded stats.

## Detailed Steps
1.  **Modify Topic Entity**: Add `option_a_tags` and `option_b_tags` (string array or comma-separated string).
2.  **Update Seed Data**: Add sample tags to existing topics for testing.
3.  **Implement `getUserStats` in AuthService**:
    - Logic for Match Rate.
    - Logic for Tags.
    - Logic for Persona.
4.  **Update API Response**: Ensure `/auth/me` returns the calculated stats.
5.  **Frontend**: Bind new fields to UI.
