# PDF Upload Feature - Visual Flow Diagram

## System Architecture

```mermaid
graph TB
    A[User Uploads PDF] --> B[File Validation]
    B --> C{Valid PDF?}
    C -->|Yes| D[Read as ArrayBuffer]
    C -->|No| E[Show Error Message]
    D --> F[PDF.js Parser]
    F --> G[Extract Text from All Pages]
    G --> H[Pattern Matching Engine]
    H --> I{Found Payment Codes?}
    I -->|Yes| J[Extract Names from Context]
    I -->|No| K[Show No Data Error]
    J --> L[Build Structured Data]
    L --> M[Display Preview Table]
    M --> N{User Confirms?}
    N -->|Yes| O[Fuzzy Match Against Table]
    N -->|No| P[Cancel & Clear Data]
    O --> Q{Found Matches?}
    Q -->|Yes| R[Update Payment Codes]
    Q -->|No| S[Show Unmatched Warning]
    R --> T[Highlight Updated Rows]
    T --> U[Show Success Statistics]
    S --> U
    P --> V[Return to Upload]
    E --> V
    K --> V
```

## Data Extraction Flow

```mermaid
graph LR
    A[Raw PDF Text] --> B[Scan for 10-Digit Codes]
    B --> C[For Each Code Found]
    C --> D[Get Surrounding Context]
    D --> E[Extract Capitalized Words]
    E --> F[Filter Non-Name Words]
    F --> G{At Least 2 Names?}
    G -->|Yes| H[Create Entry Object]
    G -->|No| I[Skip This Code]
    H --> J[Add to Results Array]
    I --> B
    J --> B
```

## Pattern Matching Strategies

```mermaid
graph TD
    A[PDF Text Input] --> B[Strategy 1: Line-by-Line]
    A --> C[Strategy 2: Named Patterns]
    A --> D[Strategy 3: Tabular Detection]
    
    B --> B1[Find 10-digit codes per line]
    B1 --> B2[Extract context names]
    B2 --> E{Results Found?}
    
    C --> C1[Match labeled formats]
    C1 --> C2[Parse Name: X Code: Y]
    C2 --> E
    
    D --> D1[Detect columnar layout]
    D1 --> D2[Parse space-separated data]
    D2 --> E
    
    E -->|Yes| F[Return Extracted Data]
    E -->|No| G[Try Next Strategy]
    G --> C
    G --> D
    G --> H[Return Empty Array]
```

## Fuzzy Matching Process

```mermaid
graph TD
    A[Extracted PDF Entry] --> B[Get Names from Entry]
    B --> C[Iterate Table Rows]
    C --> D[Get Names from Row]
    D --> E[Split into Words]
    E --> F[Compare Word by Word]
    F --> G[Calculate Levenshtein Distance]
    G --> H{Words Match?}
    H -->|Yes| I[Increment Match Count]
    H -->|No| J[Continue to Next Word]
    I --> K{Match Count ≥ 2?}
    J --> K
    K -->|Yes| L[Update Payment Code]
    K -->|No| M[Row Not Matched]
    L --> N[Highlight Row Orange]
    N --> O{More Rows?}
    M --> O
    O -->|Yes| C
    O -->|No| P[Show Statistics]
```

## User Interface Flow

```mermaid
graph TB
    A[Smart Match Tab] --> B[PDF Upload Section]
    B --> C[Click Choose PDF Button]
    C --> D[Select File Dialog]
    D --> E[File Selected]
    E --> F[Show Processing Spinner]
    F --> G[Parse PDF in Background]
    G --> H{Success?}
    H -->|Yes| I[Display File Info]
    H -->|No| J[Show Error Box]
    I --> K[Show Preview Table]
    K --> L[User Reviews Data]
    L --> M{Data Correct?}
    M -->|Yes| N[Click Confirm & Match]
    M -->|No| O[Click Cancel]
    N --> P[Run Fuzzy Matching]
    P --> Q[Update Table Rows]
    Q --> R[Switch to View Tab]
    R --> S[Show Highlighted Rows]
    O --> T[Clear Preview]
    J --> U[Return to Upload]
    T --> U
```

## Component Interaction

```mermaid
graph LR
    subgraph "User Interface"
        A[Upload Button]
        B[Preview Table]
        C[Confirm Button]
        D[Cancel Button]
    end
    
    subgraph "Processing Layer"
        E[File Reader]
        F[PDF Parser]
        G[Data Extractor]
        H[Pattern Matcher]
    end
    
    subgraph "Data Layer"
        I[extractedPdfData Array]
        J[tableBody DOM]
        K[Stats Display]
    end
    
    A --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> B
    C --> J
    J --> K
    D --> I
```

## Error Handling Flow

```mermaid
graph TD
    A[PDF Upload Attempt] --> B{File is PDF?}
    B -->|No| C[Show Format Error]
    B -->|Yes| D{File Readable?}
    D -->|No| E[Show Read Error]
    D -->|Yes| F{Text Extractable?}
    F -->|No| G[Show Extraction Error]
    F -->|Yes| H{Codes Found?}
    H -->|No| I[Show No Codes Error]
    H -->|Yes| J{Names Found?}
    J -->|No| K[Show No Names Error]
    J -->|Yes| L[Display Preview]
    L --> M{User Confirms?}
    M -->|No| N[Clear Data]
    M -->|Yes| O{Matches Found?}
    O -->|No| P[Show Unmatched Warning]
    O -->|Yes| Q[Update Complete]
    C --> R[Return to Upload]
    E --> R
    G --> R
    I --> R
    K --> R
    N --> R
    P --> S[Show Results]
    Q --> S
```

## State Management

```mermaid
graph LR
    A[Initial State] -->|Upload PDF| B[Processing State]
    B -->|Success| C[Preview State]
    B -->|Error| D[Error State]
    C -->|Confirm| E[Matching State]
    C -->|Cancel| A
    D -->|Retry| A
    E -->|Complete| F[Results State]
    F -->|View Table| G[View State]
    G -->|New Upload| A
```

## Performance Optimization

```mermaid
graph TD
    A[Large PDF Uploaded] --> B[Read in Chunks]
    B --> C[Process Page by Page]
    C --> D[Stream Text Extraction]
    D --> E[Buffer Results]
    E --> F[LIMIT: First 50 in Preview]
    F --> G[Lazy Load Remaining]
    G --> H[Efficient Memory Usage]
    
    I[Matching Phase] --> J[Batch Process Entries]
    J --> K[Optimize String Operations]
    K --> L[Cache Name Comparisons]
    L --> M[Fast Fuzzy Matching]
```

## Security Model

```mermaid
graph TB
    A[User's Computer] --> B[Browser Sandbox]
    B --> C[JavaScript Engine]
    C --> D[PDF.js Library]
    D --> E[Local File Access]
    E --> F[ArrayBuffer in Memory]
    F --> G[Text Extraction]
    G --> H[Data Processing]
    H --> I[DOM Updates]
    
    style E fill:#90EE90
    style F fill:#90EE90
    style G fill:#90EE90
    
    note[All processing happens locally<br/>No data leaves the browser] -.-> F
```

---

## Legend

- **Rectangle**: Process or Action
- **Diamond**: Decision Point
- **Circle**: Start/End Point
- **Arrow**: Data Flow
- **Green Fill**: Secure/Local Operation
- **Subgraph**: Component Grouping

---

**Note:** These diagrams illustrate the complete flow of the PDF upload and extraction feature, from user interaction to data matching and table updates.
