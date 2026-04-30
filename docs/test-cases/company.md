## Describe: Company Listing & Grid UI
1. Verify that the Companies listing page loads successfully and displays charts, filters, and the companies grid.
2. Verify that the total Companies count is displayed and matches the grid pagination total.
3. Verify that the grid displays N/A for empty fields consistently without UI break.
4. Verify that horizontal scrolling allows viewing all columns without layout breaking.
5. Verify that the grid retains current filters/sort after page refresh (if expected behavior).
6. Verify that the Companies listing page shows a friendly error state if the data unable to load.
7. Verify that charts do not overlap or break layout when data is missing or zero.
8. Verify that sorting does not break when the column contains N/A values (N/A handled consistently).
9. Verify that sorting remains stable and does not randomize results when toggled quickly.
10. Verify that the grid does not become unclickable after closing the filters panel (no overlay remains).
11. Verify that proper validation messages are displayed instead of generic errors.
12. Verify that system does not crash or freeze when user rapidly opens and closes dropdowns.

## Describe: Analytics & Charts
13. Verify that the 'Companies by Contracts' donut chart renders with Active vs Inactive contract breakdown.
14. Verify that the 'Companies by Market Verticals' donut chart renders with market vertical distribution and legend.
15. Verify that the Companies trend chart renders and is aligned with the selected time range on the x‑axis.

## Describe: Search Functionality
16. Verify that the Search by Company input allows searching by full company name and returns matching results.
17. Verify that the Search by Company input supports partial text search and updates the grid accordingly.
18. Verify that clearing the search input restores the default company list results.
19. Verify that search with special characters (e.g., @, #, %) does not crash and returns valid 'no results' behavior.
20. Verify that search with very long text does not break UI and is handled gracefully.
21. Verify that the grid shows 'No results' state when filters return no matching companies.

## Describe: Filter Management (Market Vertical & More Filters)
22. Verify that the Market Vertical filter dropdown opens and shows all available market vertical options.
23. Verify that the Market Vertical filter supports searching within the dropdown list (Search by Industry).
24. Verify that the user can select one market vertical option and the grid updates accordingly.
25. Verify that the user can select multiple market vertical options (checkbox multi-select) and the grid updates accordingly.
26. Verify that deselecting a selected market vertical option removes the filter and updates the grid.
27. Verify that Market Vertical dropdown does not close unexpectedly while selecting multiple options.
28. Verify that Market Vertical dropdown selection does not reset after interacting with other page elements via pagination.
29. Verify that the More Filters panel opens from the Companies page and overlays the page correctly.
30. Verify that the More Filters panel shows filters for Country, States, Cities, Parent Company, Market Verticals, Created Date, Last Activity, and Last Modified.
31. Verify that the Country dropdown allows selecting a country and filters the grid accordingly after Apply Filters.
32. Verify that the States dropdown allows selecting a state and filters the grid accordingly after Apply Filters.
33. Verify that the Cities dropdown allows selecting a city and filters the grid accordingly after Apply Filters.
34. Verify that the Parent Company dropdown allows selecting a parent company and filters the grid accordingly after Apply Filters.
35. Verify that the Select SP Status dropdown allows selecting a status and filters the grid accordingly after Apply Filters.
36. Verify that the Created Date picker allows selecting a date and filters results after Apply Filters.
37. Verify that the Last Activity date picker allows selecting a date and filters results after Apply Filters.
38. Verify that the Last Modified date picker allows selecting a date and filters results after Apply Filters.
39. Verify that the Apply Filters button applies selected filters, closes the panel, and refreshes the grid results.
40. Verify that the Cancel button closes the More Filters panel without applying changes to the grid.
41. Verify that the Clear All option clears all selected filters in the panel and resets to default state.
42. Verify that the More Filters panel does not allow invalid states selection without selecting a country first.
43. Verify that the More Filters panel does not allow invalid cities selection without selecting a state first.
44. Verify that invalid date input (manual typing wrong format) is rejected or corrected with validation.
45. Verify that selecting a future date in Last Activity/Last Modified does not return incorrect results.
46. Verify that applying filters with no selection does not change the grid unexpectedly.
47. Verify that clicking Apply Filters multiple times rapidly does not duplicate requests or break UI.
48. Verify that Clear All resets all filter fields (including dates) and does not leave stale chips/values behind.
49. Verify that Cancel from the More Filters panel discards unsaved filter changes.
50. Verify that the panel close (X) behaves the same as Cancel and does not apply filters.
51. Verify that More Filters Apply Filters button is disabled or shows validation when required filter dependencies are incomplete.
52. Verify that rapid open/close of filters and dropdowns does not cause UI flicker or stuck overlays.

## Describe: Sorting & Pagination
53. Verify that applied filters persist when navigating between pages using pagination controls.
54. Verify that column sorting works when clicking on a sortable column header (e.g., Company Name, Created Date).
55. Verify that sorting toggles between ascending and descending order on repeated clicks.
56. Verify that pagination controls (next/previous) navigate between pages and update the row range display.
57. Verify that changing 'Rows per page' updates the number of displayed rows and refreshes the grid.
58. Verify that pagination does not reset unexpectedly when filters are applied.
59. Verify that pagination controls are disabled appropriately on first/last page to prevent invalid navigation.

## Describe: Export & External Actions
60. Verify that the Export button initiates an export action and downloads/produces the expected file output (if enabled).
61. Verify that Export is blocked or shows proper message when there is no data to export.
62. Verify that Export handles large datasets without UI freeze (shows loader).
63. Verify that the page does not lose user-applied filters/sort when switching tabs or navigating away and back (if expected).

## Describe: Create Company Workflow
64. Verify that the Create Company button opens the Create Company form/modal successfully.
65. Verify that user is able to open the Create a New Company screen successfully.
66. Verify that Company Name field accepts valid company name and is marked as mandatory.
67. Verify that Market Vertical dropdown opens correctly and displays all available options.
68. Verify that user is able to search and select a value from Market Vertical dropdown.
69. Verify that Strategic Partnership Status dropdown opens and displays all valid options.
70. Verify that user can select any Strategic Partnership Status successfully.
71. Verify that Company Domain field accepts a valid domain format.
72. Verify that No. of Employees field accepts numeric values only.
73. Verify that Revenue field accepts valid numeric input.
74. Verify that Address field allows user to search and select an address from Google Maps suggestions.
75. Verify that selected address is correctly reflected on the map.
76. Verify that Create Company button gets enabled after filling all mandatory fields.
77. Verify that company is created successfully when user clicks on Create Company with valid data.
78. Verify that newly created company is visible in the company listing after successful creation.
79. Verify that Cancel button closes the Create Company screen without saving data.
80. Verify that error message is displayed when user tries to create a company without entering Company Name.
81. Verify that error message is shown when Market Vertical is not selected and user clicks Create Company.
82. Verify that Create Company button remains disabled if mandatory fields are missing.
83. Verify that Company Domain field does not accept invalid domain formats.
84. Verify that No. of Employees field does not accept alphabetic or special characters.
85. Verify that Revenue field does not accept invalid characters or negative values.
86. Verify that user cannot submit the form without selecting an Address.
87. Verify that invalid or random text entered in Address field does not allow company creation.
88. Verify that dropdown values do not disappear or overlap when opened multiple times.
89. Verify that selected Market Vertical value is not reset unexpectedly on form interaction.
90. Verify that selected Strategic Partnership Status remains intact after interacting with other fields.
91. Verify that user is prevented from creating duplicate company with same name.
92. Verify that form data is not saved when user clicks Cancel.
93. Verify that Create Company button is not accessible for users without permission (proper access control for SM and other roles).

## Describe: Change Review History
94. Verify that the Change Review History button opens the review history change flow successfully.
95. Verify that user is able to view change review history button on company listing to HO
96. Verify that on company review history page only those companies are visible in which user edit anything in it
97. Verify that user is able to view the change history against the company by clicking on it
98. Verify that user can view every change which is done by other role users (SM and SP)

## Describe: Company Details Page
99. Verify that Company Details page loads successfully for a selected company.
100. Verify that company header displays company name and phone number correctly.
101. Verify that Edit button is visible and clickable for authorized users.
102. Verify that Market Vertical, Created Date, and Company Owner are displayed correctly.
103. Verify that About this Company section expands and collapses properly.
104. Verify that all company details fields display correct values when expanded.
105. Verify that Properties, Deals, Contacts, and Attachments counts are displayed correctly.
106. Verify that clicking Properties expands the list without page reload.
107. Verify that clicking Deals expands the list without page reload.
108. Verify that clicking Contacts expands and shows contact details correctly.
109. Verify that Activities tab displays activity timeline grouped by month.
110. Verify that system-generated activities are displayed with correct labels and timestamps.
111. Verify that Company Details page shows an error or fallback state if company data fails to load.
112. Verify that page does not break when company phone number is missing (shows N/A).
113. Verify that unauthorized users cannot see or access the Edit button.
114. Verify that About this Company section handles missing field values gracefully.
115. Verify that expanding Properties, Deals, or Contacts does not cause UI overlap or layout issues.
116. Verify that Activities tab handles empty activity list without errors.
117. Verify that side panels and modals close properly on Cancel or close icon.
118. Verify that background page is not scrollable when modal is open.
119. Verify that rapid switching between Activities, Notes, and Tasks does not break UI.
120. Verify that page retains state correctly after refresh (if expected behavior).

## Describe: Notes Management
121. Verify that Notes tab opens and displays existing notes correctly.
122. Verify that Create New Note button opens Add Notes modal.
123. Verify that user can create a note with valid subject and description.
124. Verify that newly created note appears in Notes timeline immediately.
125. Verify that Edit option allows updating an existing note successfully.
126. Verify that Delete option opens confirmation modal for note deletion.
127. Verify that note is deleted successfully after confirmation.
128. Verify that Notes tab shows empty state when no notes exist.
129. Verify that user should not able to create a note by clicking on Save button when required note fields are empty.
130. Verify that note creation is prevented with empty subject or description.
131. Verify that user cannot save note exceeding maximum character limit.
132. Verify that deleting a note without confirmation does not remove it.

## Describe: Tasks Management
133. Verify that Tasks tab opens and displays empty state when no tasks exist.
134. Verify that New Task button opens Create New Task panel.
135. Verify that user can create a task with valid title, description, type, priority, and due date.
136. Verify that newly created task appears in the task list with correct details.
137. Verify that task details panel opens when clicking on a task.
138. Verify that Edit option allows updating task details successfully.
139. Verify that Delete option removes the task after confirmation.
140. Verify that task status, priority, and type badges display correctly.
141. Verify that pagination and rows-per-page controls work correctly in Tasks tab.
142. Verify that Tasks tab shows proper empty state message when no tasks exist.
143. Verify that user should not able to create a task by clicking on Save button when required task fields are missing.
144. Verify that task creation is prevented without selecting type, priority, or due date.
145. Verify that invalid due date (past date, if restricted) is not accepted.
146. Verify that task edit does not allow clearing mandatory fields.
147. Verify that deleting a task requires confirmation before removal.
148. Verify that task list does not duplicate entries on rapid create/delete actions.
149. Verify that in company tasks tab all the filters should be working as expected
