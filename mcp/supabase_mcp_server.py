"""
Supabase MCP Server - Python-based MCP server for Supabase database operations.
Connects to your Supabase project using the service role key.
"""

import os
import json
import ssl
import warnings
import httpx
from mcp.server.fastmcp import FastMCP

# Suppress SSL warnings for corporate proxy environments
warnings.filterwarnings("ignore", message="Unverified HTTPS request")
os.environ["PYTHONHTTPSVERIFY"] = "0"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Disable SSL verification (corporate proxy/Zscaler)
HTTP_CLIENT = httpx.Client(verify=False, timeout=30)

mcp = FastMCP("supabase-db")


def _headers():
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def _rest_get(table: str, params: dict = None):
    """GET from PostgREST."""
    resp = HTTP_CLIENT.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_headers(),
        params=params or {}
    )
    return resp


def _rest_post(table: str, data: dict):
    """POST to PostgREST (insert)."""
    resp = HTTP_CLIENT.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_headers(),
        json=data
    )
    return resp


def _rest_patch(table: str, data: dict, params: dict):
    """PATCH to PostgREST (update)."""
    resp = HTTP_CLIENT.patch(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_headers(),
        json=data,
        params=params
    )
    return resp


def _rest_delete(table: str, params: dict):
    """DELETE from PostgREST."""
    resp = HTTP_CLIENT.delete(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers=_headers(),
        params=params
    )
    return resp


@mcp.tool()
def execute_sql(sql: str) -> str:
    """Execute a raw SQL query against the Supabase database. Use for SELECT, INSERT, UPDATE, DELETE, DDL, or any SQL statement."""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    # Use Supabase's pg_graphql or rpc endpoint won't work for raw SQL
    # Instead use the /pg endpoint (available on Supabase projects)
    resp = HTTP_CLIENT.post(
        f"{SUPABASE_URL}/pg",
        headers=headers,
        json={"query": sql}
    )
    if resp.status_code == 200:
        try:
            return json.dumps(resp.json(), indent=2)
        except Exception:
            return resp.text
    # Fallback: try the SQL API endpoint
    resp2 = HTTP_CLIENT.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=headers,
        json={"query": sql}
    )
    if resp2.status_code == 200:
        try:
            return json.dumps(resp2.json(), indent=2)
        except Exception:
            return resp2.text
    return f"Error ({resp.status_code}): {resp.text}\nFallback ({resp2.status_code}): {resp2.text}"


@mcp.tool()
def list_tables() -> str:
    """List all tables in the public schema with their row counts."""
    sql = """
        SELECT 
            t.table_name,
            t.table_type,
            pg_stat_user_tables.n_live_tup as approx_rows
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables ON t.table_name = pg_stat_user_tables.relname
        WHERE t.table_schema = 'public'
        ORDER BY t.table_name
    """
    return execute_sql(sql)


@mcp.tool()
def describe_table(table_name: str) -> str:
    """Describe a table's columns, types, and constraints."""
    sql = f"""
        SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = '{table_name}'
        ORDER BY c.ordinal_position
    """
    return execute_sql(sql)


@mcp.tool()
def query_table(table_name: str, select: str = "*", filters: str = "", order_by: str = "", limit: int = 50) -> str:
    """
    Query a table using PostgREST. 
    
    Args:
        table_name: Name of the table
        select: Columns to select (default: *)
        filters: PostgREST filter string, e.g. 'name=eq.Milk' or 'category=eq.Dairy&in_stock=eq.true'
        order_by: Column to order by, e.g. 'name.asc' or 'created_at.desc'
        limit: Max rows to return (default: 50)
    """
    params = {"select": select, "limit": str(limit)}
    if order_by:
        params["order"] = order_by
    if filters:
        for f in filters.split("&"):
            if "=" in f:
                key, val = f.split("=", 1)
                params[key] = val
    resp = _rest_get(table_name, params)
    if resp.status_code == 200:
        data = resp.json()
        return json.dumps(data, indent=2)
    return f"Error ({resp.status_code}): {resp.text}"


@mcp.tool()
def insert_row(table_name: str, data: str) -> str:
    """
    Insert a row into a table.
    
    Args:
        table_name: Name of the table
        data: JSON string of the row to insert, e.g. '{"name": "Milk", "category": "Dairy"}'
    """
    row = json.loads(data)
    resp = _rest_post(table_name, row)
    if resp.status_code in (200, 201):
        return json.dumps(resp.json(), indent=2)
    return f"Error ({resp.status_code}): {resp.text}"


@mcp.tool()
def update_rows(table_name: str, data: str, filters: str) -> str:
    """
    Update rows in a table.
    
    Args:
        table_name: Name of the table
        data: JSON string of fields to update, e.g. '{"in_stock": false}'
        filters: PostgREST filter to identify rows, e.g. 'id=eq.5'
    """
    updates = json.loads(data)
    params = {}
    for f in filters.split("&"):
        if "=" in f:
            key, val = f.split("=", 1)
            params[key] = val
    resp = _rest_patch(table_name, updates, params)
    if resp.status_code in (200, 204):
        try:
            return json.dumps(resp.json(), indent=2)
        except Exception:
            return "Updated successfully"
    return f"Error ({resp.status_code}): {resp.text}"


@mcp.tool()
def delete_rows(table_name: str, filters: str) -> str:
    """
    Delete rows from a table.
    
    Args:
        table_name: Name of the table
        filters: PostgREST filter to identify rows, e.g. 'id=eq.5'
    """
    params = {}
    for f in filters.split("&"):
        if "=" in f:
            key, val = f.split("=", 1)
            params[key] = val
    resp = _rest_delete(table_name, params)
    if resp.status_code in (200, 204):
        try:
            return json.dumps(resp.json(), indent=2)
        except Exception:
            return "Deleted successfully"
    return f"Error ({resp.status_code}): {resp.text}"


@mcp.tool()
def get_table_row_count(table_name: str) -> str:
    """Get the exact row count for a table."""
    headers = _headers()
    headers["Prefer"] = "count=exact"
    headers["Range-Unit"] = "items"
    headers["Range"] = "0-0"
    resp = HTTP_CLIENT.get(
        f"{SUPABASE_URL}/rest/v1/{table_name}",
        headers=headers,
        params={"select": "*"}
    )
    content_range = resp.headers.get("content-range", "")
    if "/" in content_range:
        count = content_range.split("/")[1]
        return json.dumps({"table": table_name, "row_count": int(count)})
    return f"Could not determine row count. Status: {resp.status_code}"


@mcp.tool()
def search_items(query: str, table_name: str = "master_items", limit: int = 10) -> str:
    """
    Search items by name using case-insensitive pattern matching.
    
    Args:
        query: Search text
        table_name: Table to search (default: master_items)
        limit: Max results (default: 10)
    """
    params = {
        "select": "*",
        "name": f"ilike.%{query}%",
        "limit": str(limit),
        "order": "popular_score.desc"
    }
    resp = _rest_get(table_name, params)
    if resp.status_code == 200:
        return json.dumps(resp.json(), indent=2)
    return f"Error ({resp.status_code}): {resp.text}"


if __name__ == "__main__":
    mcp.run(transport="stdio")
