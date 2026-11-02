# Desktop update — awaiting Figma MCP

User chose to wait for MCP restoration instead of using the Figma UI or screenshots, then explicitly requested publication of the intermediate implementation. This draft is authorized for publication; matching the new Figma frame remains pending.

Target: https://www.figma.com/design/wk36xFew0YCSSkZcO1KUAw/1?node-id=18-32571

Requested: proportional desktop scaling, wider cases/new spacing from that frame, no pagination, smooth vertical image scrolling inside cases, preserve current case stacking. Vertical direction explicitly confirmed.

Local draft adds desktop.css and desktop.js (1440 design canvas above 1100px), vertical galleries, scale-aware sticky/about calculations. These base dimensions are provisional and have NOT been matched to the unread new Figma frame. Existing tablet/mobile carousel remains below the desktop threshold.

Verified locally at widths 1280, 1440, 1920: proportional composition, vertical gallery movement, no horizontal overflow in galleries, sticky about stage and scene change. At 1024: zoom 1, existing horizontal gallery and pagination return. Build, asset validation, JavaScript syntax and diff whitespace checks pass. Finish visual comparison, spacing, keyboard/scroll boundary QA and desktop breakpoint selection after MCP works.

Source helper opened successfully from commit c802669a21a73d01fbc2ebe6bae162852304b4a1. Project appgprj_6ae650bb63188191a361e46c9f1c47ae. The interim version will be packaged and published through the Sites source helper.
