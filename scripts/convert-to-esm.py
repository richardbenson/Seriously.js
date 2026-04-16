#!/usr/bin/env python3
"""Convert Seriously.js UMD files to ES modules."""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def strip_umd(lines, factory_pattern):
    """Return body lines after the factory invocation line."""
    for i, line in enumerate(lines):
        if re.match(factory_pattern, line.strip()):
            return lines[i + 1:]
    return None

def strip_footer(lines):
    """Remove trailing })); footer."""
    while lines and lines[-1].strip() == '':
        lines.pop()
    if lines and lines[-1].strip() == '}));':
        lines.pop()
    return lines

def write(path, content):
    with open(path, 'w') as f:
        f.write(content)
    rel = os.path.relpath(path, ROOT)
    print(f'  converted: {rel}')

# ---------------------------------------------------------------------------
# 1. Core: seriously.js
# ---------------------------------------------------------------------------
def convert_core():
    path = os.path.join(ROOT, 'seriously.js')
    with open(path) as f:
        lines = f.read().splitlines()

    body = strip_umd(lines, r'\}\(window,\s*function\s*\(window\)\s*\{')
    if body is None:
        print('ERROR: could not find core factory line'); sys.exit(1)

    body = strip_footer(body)

    # Replace `return Seriously;` at the end with nothing (we export below)
    for i in range(len(body) - 1, max(len(body) - 5, -1), -1):
        if body[i].strip() == 'return Seriously;':
            body[i] = ''
            break

    header = """\
/* eslint-disable no-var */
/* global globalThis, self */
// Resolve the global object for browser, worker, and Node.js environments.
var window = typeof globalThis !== 'undefined' ? globalThis : // eslint-disable-line no-shadow
             typeof self !== 'undefined' ? self :
             typeof global !== 'undefined' ? global : {};

"""
    write(path, header + '\n'.join(body) + '\nexport default Seriously;\n')


# ---------------------------------------------------------------------------
# 2. Standard plugin (one Seriously argument)
# ---------------------------------------------------------------------------
STANDARD_PATTERN = r'\}\(window,\s*function\s*\(Seriously\)\s*\{'

def convert_plugin(path, rel_core):
    with open(path) as f:
        lines = f.read().splitlines()

    body = strip_umd(lines, STANDARD_PATTERN)
    if body is None:
        print(f'  SKIP (no UMD match): {os.path.relpath(path, ROOT)}')
        return

    body = strip_footer(body)
    write(path, f"import Seriously from '{rel_core}';\n\n" + '\n'.join(body) + '\n')


# ---------------------------------------------------------------------------
# 3. Three.js plugin (Seriously + THREE arguments)
# ---------------------------------------------------------------------------
THREE_PATTERN = r'\}\((?:window|this),\s*function\s*\(Seriously,\s*THREE\)\s*\{'

def convert_three_plugin(path, rel_core):
    with open(path) as f:
        lines = f.read().splitlines()

    body = strip_umd(lines, THREE_PATTERN)
    if body is None:
        print(f'  SKIP (no THREE match): {os.path.relpath(path, ROOT)}')
        return

    body = strip_footer(body)
    imports = f"import Seriously from '{rel_core}';\nimport * as THREE from 'three';\n\n"
    write(path, imports + '\n'.join(body) + '\n')


# ---------------------------------------------------------------------------
# 4. Standalone util with return value
# ---------------------------------------------------------------------------
UTIL_PATTERN = r'\}\(this,\s*function\s*\(\)\s*\{'

def convert_util(path, export_name):
    with open(path) as f:
        lines = f.read().splitlines()

    body = strip_umd(lines, UTIL_PATTERN)
    if body is None:
        print(f'  SKIP (no util match): {os.path.relpath(path, ROOT)}')
        return

    body = strip_footer(body)

    # Replace `return X;` at the end with `export default X;`
    for i in range(len(body) - 1, max(len(body) - 5, -1), -1):
        m = re.match(r'\s*return\s+(\w+)\s*;', body[i])
        if m:
            body[i] = f'export default {m.group(1)};'
            break

    write(path, '\n'.join(body) + '\n')


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
print('Converting core...')
convert_core()

print('Converting effects...')
for fname in sorted(os.listdir(os.path.join(ROOT, 'effects'))):
    if fname.endswith('.js'):
        convert_plugin(os.path.join(ROOT, 'effects', fname), '../seriously.js')

print('Converting sources...')
for fname in sorted(os.listdir(os.path.join(ROOT, 'sources'))):
    if fname.endswith('.js'):
        path = os.path.join(ROOT, 'sources', fname)
        if 'three' in fname:
            convert_three_plugin(path, '../seriously.js')
        else:
            convert_plugin(path, '../seriously.js')

print('Converting transforms...')
for fname in sorted(os.listdir(os.path.join(ROOT, 'transforms'))):
    if fname.endswith('.js'):
        convert_plugin(os.path.join(ROOT, 'transforms', fname), '../seriously.js')

print('Converting targets...')
for fname in sorted(os.listdir(os.path.join(ROOT, 'targets'))):
    if fname.endswith('.js'):
        path = os.path.join(ROOT, 'targets', fname)
        if 'three' in fname:
            convert_three_plugin(path, '../seriously.js')
        else:
            convert_plugin(path, '../seriously.js')

print('Converting util...')
for fname in sorted(os.listdir(os.path.join(ROOT, 'util'))):
    if fname.endswith('.js'):
        path = os.path.join(ROOT, 'util', fname)
        convert_util(path, 'MediaLoader')

print('Done.')
