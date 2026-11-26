/* What the AI assistant knows about the portal and each report (format, data sheets, who updates what).
   Edit this file to teach the assistant more. */
window.BCL_KNOW = {
portal: `PORTAL (Brand Concepts Limited internal portal, sudhirbnm.github.io/bcl-enquiry)
- Home page: two paths — "Institutional Enquiry" (public form for bulk/corporate gifting enquiries; saved to the Enquiry Log) and "Report Login" (staff only).
- After login, each person sees only the report tiles they have access to. Access is set by an admin in the Admin tab (ticks per user), otherwise by department + level (L1 highest).
- Admin (L1) can add/edit users and tick which reports each user can open.
- Every report: click a column heading to sort (largest first / A→Z, then reverse, then original). Totals stay fixed. Each report has an ✨ Ask AI button and an AI tab with automatic insights, an "Analyse with AI" write-up and chat. Voice works in Hindi and English (Chrome / Edge). "Talk" = hands-free conversation.
- Data is never changed from the portal: each report reads its source file/sheet; people update the source and the report picks it up when opened or refreshed.
- Tasks: in this portal chat, a user can give a task ("ask Rahul to send the PO list by Friday"); it is saved with an ID, owner and due date. Anyone can ask "has my task been done?"; the person it was given to can say "mark T… done" or add a note.`,

reports: {
factory: `FACTORY DASHBOARD — BCL's own hard-luggage factory, two production lines: PP (polypropylene) and PC (polycarbonate).
Source: "Factory data.xlsx" on the company Dropbox (edited in place by the factory team; read through the Factory Relay each time the page opens or Refresh is pressed).
Data sheets:
- Order: one row per SKU per purchase order — Order No, Order Date, Customer, Customer Type (Retail, Institution, CSD, E-com, OEM), EAN Code, Brand, Style, Colour, Size, PP/PC, Order Qty, Committed (delivery) Date, Remark/Status (short-closed etc.).
- Daily Production: Date, EAN Code, Qty produced.
- Dispatch: Date, Order No, EAN Code, Qty — QC-passed goods shipped against that order (matched by Order No + EAN).
- Order In Discussion: tentative orders not yet confirmed, with a Tentative Delivery Date and status (Converted to PO / Dropped are excluded).
- Lists: dropdown values (customer types etc.).
Views:
- Order Book: open (pending = ordered − dispatched) quantity by delivery month bucket. "Current month order book" = what was due this month; "Remaining this month" = still not dispatched; later months, Later, Unallocated (no date). Split by customer type and by PP/PC → style.
- Production: Remaining to produce in the next 45 days (pending minus finished goods already ready), Last Day and Last 15 Days production, Actual Run Rate per day (ARR, last 15 days), "Late – produce now" (qty whose committed date has passed), Required Run Rate per day (RRR) to meet future committed dates. RRR above ARR = red (falling behind). "Extra N" = produced more than needed.
- Order Fulfillment: one row per Order No + Style + line — total ordered, supplied (dispatched), ready in FG, balance, remark (Delayed / Due within 15 days / Due later / On time), status (Pending / Short closed / Completed), committed date, last dispatch date.
- FG Ready: produced − dispatched by EAN = finished goods lying at the factory; flags "Stock at factory", "Dispatch > Production" (data issue), production not in Order sheet, excess dispatch lines, order lines whose EAN is text.
- Pipeline: Order In Discussion quantity by tentative month, "Tentative date passed".`,

buying: `BUYING INTELLIGENCE — five years of purchase (GRN) history for the retail division.
Source: an Excel/CSV upload or the linked Google Sheet, one row per GRN line: FY, GRN No/Date, PO No/Date, Vendor (Detail Name), Brand, Department, Category, Season, Channel/Buying for, Qty, Gross / Net purchase amount, cost.
Tabs: Executive Summary (yearly value, qty, growth), Brand Analysis, Vendor Performance (value share, lead time PO→GRN), Category Report, Season & Category, Channel Analysis, AI Assistant, Full Data. Values in ₹ crore/lakh.`,

'buying-dbx': `BUYING INTELLIGENCE · DROPBOX — same analysis as Buying Intelligence, but read straight from the GRN files (every GRN since FY 21-22) and the Item Master on Dropbox through the Buying Relay. Tabs: Executive Summary, Brand Analysis, Vendor Performance, Category Report, Season & Category, Channel Analysis, AI Assistant, Full Data.`,

openpo: `OPEN PO — every pending purchase order line not yet received, by expected delivery month; overdue first.
Source: "Pending PO.xlsx" + Item Master on Dropbox (Open PO Relay). Fields: PO No, PO date, Vendor, Brand, Category, Channel / Buying for, EAN/BarCode, Style, Colour, Qty, Landed Rate, Amount, Currency, Delivery Date.
Views: Brand View / Category View tree (brand → category → style), switch Qty or Value (₹ lakh), Month or Quarter buckets; "ND" = no delivery date; checks for amount mismatches.`,

otb: `OTB PLANNER (Open-To-Buy) — how much stock to buy per brand/category for the coming quarters.
Source: Google Sheet with tabs "Data Sheet" (Brand Remark, Brand, Type of Business, Department, Category, Stock Channel, Option, Opening / Sale / Inward for 3 quarters, Budget % per quarter, Ideal Stock Cover), "OTB CALC" and "Budget and Cover days Calc".
Logic: closing stock = opening + inward − sale; stock cover (days/months) vs ideal cover; OTB = stock needed for ideal cover − (opening + planned inward). Tables by brand, by category and per new brand (Superdry, Off-White, Juicy Couture).`,

secondary: `SECONDARY SALES — sell-through at channel partners' stores.
Source: upload with 17 columns: Year, Channel Partner, Store Name, Operational Status, Store Grade, City, Location Type, Month, Brand, Department, Category, Sale Qty, NSV (net sales value), MRP SALE, Season, Event, EOSS (end-of-season sale flag).
Views by channel partner, brand, department, category, with filters.`,

inward: `INWARD PLAN — planned inward (purchases arriving) and the payments due.
Source: upload; headers on row 4: EANCODE, FACTORY, Type of Order, Origin, Country, Advance, Payment, Final Cost, Month, Qtr, Qty, Cost Value, Brand…
Tabs: Brand Report (by type/department/brand, drill down), Vendor Wise, Payment Plan (advance and balance payments by month), Payment Master.`,

catalogue: `PRODUCT INTELLIGENCE (Catalogue) — search every SKU with images, colours and prices.
Source: product master Google Sheet (published CSV) + Bagline Shopify store for images (SKU → product handle map). Search by SKU/EAN/style/brand, filter, view product images.`,

lfs: `LFS PERFORMANCE — five years of large-format-store (department store) sales performance.`,
secondary_sales: '',
myntra: `MYNTRA LAUNCH — catalogue, copy and strategy workspace for the Myntra marketplace launch.`,
'enquiry-data': `ENQUIRY LOG — every institutional / bulk enquiry from the public form, with its status.`
}
};
