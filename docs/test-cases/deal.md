# Deals Module Test Cases - Categorized

## Describe: Deal Creation Workflow
1. Verify that Create Deal modal opens successfully
2. Verify that mandatory field validation works correctly
3. Verify that deal is created with valid inputs
4. Verify that newly created deal appears in listing
5. Verify that Company dropdown searches and shows matching results in Create Deal drawer
6. Verify that Property dropdown searches and shows matching results after selecting a company
7. Verify that Cancel Create Deal closes drawer without creating a record

## Describe: Deals Dashboard & Listing
8. Verify that Deals dashboard loads correctly
9. Verify that Deals charts render correct data
10. Verify that total deal amount displays correctly
11. Verify that search by Deal Name works correctly
12. Verify that All Deals filter shows all records
13. Verify that Assigned filter shows assigned deals only
14. Verify that Unassigned filter shows unassigned deals only
15. Verify that multiple filters work together
16. Verify that Clear All resets applied filters
17. Verify that deal listing columns show correct values
18. Verify that sorting works on Deal Name
19. Verify that sorting works on deal listing grid
20. Verify that pagination works correctly
21. Verify that bulk assignment works correctly
22. Verify that searching with a non-existent deal name returns no results

## Describe: Deal Details & Management
23. Verify that Deal Details page opens correctly
24. Verify that deal overview data is accurate
25. Verify that stage update persists after refresh
26. Verify that proposal creation starts successfully
27. Verify that deal can be edited successfully
28. Verify that closing deal as Won updates status
29. Verify that closing deal as Lost updates status
30. Verify that closed deals are handled correctly
31. Verify that Deal detail page shows all sidebar sections
32. Verify that Deal detail page shows the stages bar and all overview tabs
33. Verify that Edit Deal form opens pre-filled and Save remains disabled without changes
34. Verify that Cancel Edit Deal closes drawer without saving changes
35. Verify that permissions restrict unauthorized actions

## Describe: Activities & Logs
36. Verify that activities logs load for different record types
37. Verify that note log title uses creator username
38. Verify that note HTML formatting: bullets/links
39. Verify that note long text truncation + See more/less
40. Verify that note update reflects new content + user + timestamp
41. Verify that task log title uses creator username
42. Verify that task fields render: title/type/priority/description
43. Verify that task long description truncation + toggle
44. Verify that task update reflects new content + updater + timestamp
45. Verify that permissions: unauthorized user cannot see logs
46. Verify that Activities tab loads with at least one dated entry

## Describe: Notes Management
47. Verify that Subject field is mandatory while creating a note
48. Verify that system shows validation error when Subject is empty
49. Verify that system shows validation error when Description is empty
50. Verify that note count updates after adding a note
51. Verify that edited note shows updated content in listing
52. Verify that delete confirmation modal appears before deleting note
53. Verify that note is not deleted when cancel is clicked on confirmation modal
54. Verify that empty state is shown again after deleting last note
55. Verify that user cannot save note when required fields are missing
56. Verify that Notes tab is visible and Create New Note drawer opens with correct fields

## Describe: Tasks Management
57. Verify that Task Title field is mandatory while creating a task
58. Verify that Task Description field is mandatory while creating a task
59. Verify that Type dropdown shows options: To-do, Email, Call, LinkedIn
60. Verify that Priority dropdown shows options: High, Medium, Low
61. Verify that Due Date field is mandatory while creating a task
62. Verify that system shows validation error when required fields are missing
63. Verify that user can filter tasks by Type
64. Verify that user can filter tasks by Priority
65. Verify that user can filter tasks by Status
66. Verify that user can filter tasks by Due Date range
67. Verify that user can search tasks using Search by Title
68. Verify that user can edit an existing task
69. Verify that edited task details are updated in listing
70. Verify that user can delete a task after confirmation
71. Verify that task is not deleted when delete action is cancelled
72. Verify that completed task is shown under Completed status filter
73. Verify that unchecking completed checkbox marks task as To-Do again
74. Verify that pagination works correctly in task listing
75. Verify that tasks are sorted correctly by Due Date
76. Verify that Tasks tab shows expected columns and New Task button
77. Verify that Create New Task drawer opens with all required fields
