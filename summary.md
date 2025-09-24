Based on the PDF manual and the Excel file you provided, here is a summary of the proposed web application design.

### **Application Design Summary**

The application will be a web-based dashboard that replicates and enhances the functionality of the original ZeroWare Excel-based tool. It will provide a user-friendly interface for managing Zero Loss studies, from data input to automated chart generation. The application will be a single-page application (SPA) built with Next.js, and it will be able to handle data management, visualization, and user interactions efficiently.

### **Key Features**

* **User Authentication**: Secure login for different user roles (e.g., administrator, data entry).
* **Data Input Forms**: A structured form-based interface to replace the Excel sheets for the "Input Phase," allowing for easy and validated data entry.
* **Automated Chart Generation**: Real-time generation of key charts, such as the **Pareto Chart**, based on the input data. The charts will be interactive, allowing users to zoom, filter, and drill down into the data.
* **Report Generation**: The ability to generate and export reports (e.g., PDF, CSV) from the dashboard, summarizing the analysis and charts.
* **Data Management**: A backend system to store, retrieve, and update study data, ensuring data integrity and accessibility.

### **User Flow**

1.  **Preparation Phase**:
    * **User Login**: The user logs into the application.
    * **Study Setup**: The user is guided through a setup wizard to define the parameters of a new study (e.g., product, machine, duration). This information will be used to initialize the database schema for the specific study.

2.  **Input Phase**:
    * **Data Entry**: The user accesses dedicated forms to input data for each machine/study. The forms will be designed to mirror the structure of the `S1`, `CT`, and `Piece Counters` sheets from the original Excel file.
    * **Validation**: The application will perform real-time data validation to prevent entry errors.

3.  **Output Phase**:
    * **Dashboard View**: The user navigates to the dashboard, where the application automatically processes the entered data.
    * **Visualization**: The dashboard dynamically displays charts and graphs, such as the **Pareto Chart** and other reports. The user can interact with the charts and select different filters or views.
    * **Reporting**: The user can generate and download reports in various formats.

### **Technology Stack**

* **Next.js**: Serves as the primary framework for building the front-end and back-end (API routes). Its server-side rendering (SSR) and static site generation (SSG) capabilities will ensure a fast, SEO-friendly, and responsive user experience.
* **Tailwind CSS**: A utility-first CSS framework for rapid and consistent styling of the application's user interface. It will provide a clean and modern look without the overhead of custom CSS.
* **Shadcn/ui**: A collection of reusable UI components built on top of Tailwind CSS and React. This will accelerate development and ensure a high-quality, accessible, and consistent design across the dashboard.
* **Drizzle ORM**: A lightweight and performant TypeScript ORM that will be used for database schema definition and querying. It will manage the application's data layer, ensuring a type-safe and reliable connection to the database. It is a good choice for Next.js as it can be used on the edge.