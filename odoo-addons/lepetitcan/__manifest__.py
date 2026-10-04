# -*- coding: utf-8 -*-
# Part of Le Petit Can. See LICENSE file for full copyright and licensing details.

{
    'name': 'Le Petit Can',
    'version': '17.0.1.0.0',
    'category': 'Services',
    'summary': 'Modelos de negocio Le Petit Can: servicios, trabajadores, citas y bloqueos',
    'author': 'Le Petit Can',
    'depends': ['calendar', 'contacts'],
    'data': [
        'security/ir.model.access.csv',
        'data/servicio_demo.xml',
        'views/servicio_views.xml',
        'views/trabajador_views.xml',
        'views/bloqueo_views.xml',
    ],
    'installable': True,
    'application': False,
    'license': 'LGPL-3',
}