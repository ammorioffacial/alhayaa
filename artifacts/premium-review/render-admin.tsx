import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import Admin from '../../src/components/admin';
import { demoCategories, demoProducts } from '../../src/lib/demo';
Object.assign(globalThis, { React });
writeFileSync('artifacts/premium-review/admin-fixture.html', renderToStaticMarkup(React.createElement(Admin, { initial: demoProducts, categories: demoCategories, loadError: '' })));
