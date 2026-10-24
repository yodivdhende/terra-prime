/**
 * Terra Prime <-> Google Sheets bridge.
 *
 * Connects this spreadsheet to the Railway-hosted `testaliceDB` MySQL database
 * via Apps Script's built-in Jdbc service, and exposes a sidebar for picking a
 * table, loading it into the sheet, and pushing edits back with one click.
 *
 * Fill in the connection constants below with the credentials from the
 * Railway MySQL "Connect" tab (Public Networking must be enabled - see
 * ../PLAN.md for the full setup walkthrough).
 */

const DB_HOST = 'YOUR_RAILWAY_HOST'; // e.g. "containers-us-west-1.railway.app"
const DB_PORT = 'YOUR_RAILWAY_PORT'; // e.g. "7777"
const DB_NAME = 'testaliceDB';
const DB_USER = 'sheets_user';
const DB_PASS = 'StrongPassword123!';

/**
 * Tables exposed in the sidebar, mapped to their primary-key column(s).
 * The key columns decide whether a sheet row becomes an UPDATE or an INSERT
 * when saving.
 */
const TABLES = {
  Users: ['Id'],
  Characters: ['Id'],
  Character_Versions: ['Id'],
  Skills: ['Id'],
  Skill_Groups: ['Id'],
  Implants: ['Id'],
  Items: ['Id'],
  Events: ['Id'],
  Event_Participants: ['Event', 'User'],
  Party: ['Id'],
  Party_Members: ['Party', 'Member'],
  Messages: ['Id'],
  Admins: ['UserId']
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Terra Prime').addItem('Open sidebar', 'showSidebar').addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Terra Prime');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getConnection_() {
  const url = `jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  return Jdbc.getConnection(url, DB_USER, DB_PASS);
}

/** Table names for the sidebar's dropdown. */
function getTableNames() {
  return Object.keys(TABLES);
}

/** Name of the sheet the user currently has open, for the sidebar's "active sheet" hint. */
function getActiveSheetName() {
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getName();
}

/**
 * Loads `tableName` from the database into a same-named sheet, replacing any
 * existing contents. Returns the number of data rows written.
 */
function loadTable(tableName) {
  if (!TABLES[tableName]) throw new Error(`Unknown table: ${tableName}`);

  const conn = getConnection_();
  try {
    const stmt = conn.createStatement();
    const rs = stmt.executeQuery(`SELECT * FROM \`${tableName}\``);
    const meta = rs.getMetaData();
    const columnCount = meta.getColumnCount();

    const header = [];
    for (let i = 1; i <= columnCount; i++) header.push(meta.getColumnName(i));

    const rows = [];
    while (rs.next()) {
      const row = [];
      for (let i = 1; i <= columnCount; i++) row.push(rs.getString(i));
      rows.push(row);
    }
    rs.close();
    stmt.close();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tableName);
    if (sheet) sheet.clear();
    else sheet = ss.insertSheet(tableName);

    sheet.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    if (rows.length) sheet.getRange(2, 1, rows.length, header.length).setValues(rows);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, header.length);
    ss.setActiveSheet(sheet);

    return rows.length;
  } finally {
    conn.close();
  }
}

/**
 * Pushes the active sheet's rows back to its matching DB table. Rows whose
 * primary-key cell(s) match an existing row are UPDATEd; all others are
 * INSERTed. Runs inside a single transaction, so a failure leaves the
 * database untouched.
 */
function saveActiveSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const tableName = sheet.getName();
  const keyColumns = TABLES[tableName];
  if (!keyColumns) {
    throw new Error(`"${tableName}" is not a linked table. Load it from the sidebar first.`);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { updated: 0, inserted: 0 };

  const header = values[0].map(String);
  const keyIndexes = keyColumns.map((col) => {
    const idx = header.indexOf(col);
    if (idx === -1) throw new Error(`Primary key column "${col}" not found in sheet "${tableName}"`);
    return idx;
  });

  const conn = getConnection_();
  let updated = 0;
  let inserted = 0;
  try {
    conn.setAutoCommit(false);

    const updateSql = `UPDATE \`${tableName}\` SET ${header.map((col) => `\`${col}\` = ?`).join(', ')} WHERE ${keyColumns
      .map((col) => `\`${col}\` = ?`)
      .join(' AND ')}`;
    const insertSql = `INSERT INTO \`${tableName}\` (${header.map((col) => `\`${col}\``).join(', ')}) VALUES (${header
      .map(() => '?')
      .join(', ')})`;

    const updateStmt = conn.prepareStatement(updateSql);
    const insertStmt = conn.prepareStatement(insertSql);

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const hasKey = keyIndexes.every((idx) => row[idx] !== '' && row[idx] !== null);

      if (hasKey) {
        row.forEach((cell, i) => bindValue_(updateStmt, i + 1, cell));
        keyIndexes.forEach((idx, i) => bindValue_(updateStmt, header.length + i + 1, row[idx]));
        if (updateStmt.executeUpdate() > 0) {
          updated++;
          continue;
        }
      }

      row.forEach((cell, i) => bindValue_(insertStmt, i + 1, cell));
      insertStmt.executeUpdate();
      inserted++;
    }

    updateStmt.close();
    insertStmt.close();
    conn.commit();
  } catch (err) {
    conn.rollback();
    throw err;
  } finally {
    conn.setAutoCommit(true);
    conn.close();
  }

  return { updated, inserted };
}

/** Binds a sheet cell value onto a prepared statement parameter, mapping blanks to SQL NULL. */
function bindValue_(stmt, index, value) {
  if (value === '' || value === null || value === undefined) {
    stmt.setObject(index, null);
  } else if (value instanceof Date) {
    stmt.setTimestamp(index, Jdbc.newTimestamp(value.getTime()));
  } else {
    stmt.setObject(index, value);
  }
}
