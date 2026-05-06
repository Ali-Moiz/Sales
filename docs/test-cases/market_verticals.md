# Market Verticals & Settings Test Cases - Categorized

## Describe: Create & Edit Question Workflow
1. Verify that Add Question form shows required fields (Question Statement, Answer Type, Market Verticals)
2. Verify that Save button is disabled or shows validation when required fields are empty
3. Verify that Question Statement field does not allow saving blank/whitespace-only values
4. Verify that Instructions field is optional and can be left empty without validation error
5. Verify that Answer Type dropdown contains options (Multiple Selection, Radio Buttons (Single Selection), DropDown)
6. Verify that Market Verticals dropdown supports multi-select of industries and shows selected items correctly
7. Verify that Market Verticals dropdown search filters industries and allows selecting from filtered results
8. Verify that Required checkbox toggles the required status and persists after saving
9. Verify that Add option button adds an option input row and allows multiple options to be added
10. Verify that user cannot save a question with Answer Type requiring options when no options are added (if applicable)
11. Verify that duplicate options are prevented or handled gracefully with validation (if rules exist)
12. Verify that clicking Cancel on Add/Edit form returns to previous page without saving changes
13. Verify that saving a new question shows success feedback and displays the question in the list
14. Verify that clicking Edit from the menu navigates to edit form with existing values prefilled
15. Verify that editing a question updates Last Edited By and Last Edited On correctly after save

## Describe: Market Verticals & Industry Management
16. Verify that Market Verticals page shows a graceful error state when industries API fails
17. Verify that Search by Industry supports partial matches and is case-insensitive
18. Verify that entering special characters in Search by Industry does not crash UI and returns valid results or none
19. Verify that clearing Search by Industry resets the grid to default results
20. Verify that each industry row is clickable and opens the correct industry questions page
21. Verify that industries with zero deals/companies display 0 values (not blank)
22. Verify that Synced From value displays correct source (e.g., HubSpot) and does not overflow UI
23. Verify that Last Synced On displays correct date format and handles missing dates as N/A
24. Verify that left panel lists all industries and displays No. of Companies for each industry
25. Verify that switching industry from left panel loads the questions for the newly selected industry
26. Verify that selected industry remains highlighted after page refresh (if deep link supports it)
27. Verify that Search in left panel filters industries list correctly
28. Verify that clearing left-panel Search restores the full industries list
29. Verify that deep link to an industry questions page loads correctly when opened in a new tab

## Describe: Questions Listing & Interaction
30. Verify that questions list shows expected columns (Question Statement, Last Edited By, Last Edited On, Answer Type)
31. Verify that questions list supports vertical scrolling without header/row misalignment
32. Verify that Search by Question filters questions by statement keywords
33. Verify that invalid Search by Question shows an empty state message without showing stale results
34. Verify that question statement text truncates with ellipsis when long and does not break layout
35. Verify that Last Edited By and Last Edited On show correct values and handle missing values as N/A
36. Verify that Answer Type displays correct label (Dropdown/Radio/Multiselect) based on saved configuration
37. Verify that clicking a question row opens the question details panel showing Associated Industries, Question Statement, Answer Type, and options
38. Verify that question details panel can be closed using the close (X) icon without page refresh
39. Verify that Associated Industries chips display all linked industries correctly
40. Verify that options list in question details shows each option with its points value correctly
41. Verify that question details panel supports long content and remains scrollable without UI overlap
42. Verify that three-dot menu opens for a question row and shows Edit and Delete options
43. Verify that clicking Delete from the menu opens a confirmation prompt (if implemented) before deletion
44. Verify that deleting a question removes it from the list and updates total questions count
45. Verify that menu closes when clicking outside the menu
46. Verify that clicking Back returns to questions list and retains previous filters/search (if state retention is expected)
47. Verify that API failure on questions list shows a non-blocking error message and allows retry/navigation
48. Verify that rapid switching between industries does not crash and always loads correct questions
