# -*- coding: utf-8 -*-
from odoo import fields, models


class LpcServicio(models.Model):
    _name = 'lepetitcan.servicio'
    _description = 'Servicio Le Petit Can'

    name = fields.Char(string='Nombre', required=True)
    codigo = fields.Char(string='Código', required=True, index=True)
    descripcion = fields.Text(string='Descripción corta')
    duracion_por_tamano = fields.Text(
        string='Duración por tamaño (minutos)',
        help='JSON: {"Toy": 90, "Pequeño": 90, "Mediano": 90, "Grande": 120, "Gigante": 120}',
    )
    precio_por_tamano = fields.Text(
        string='Precio por tamaño (JSON)',
        help=(
            'JSON por tamaño. Cada entrada: {"tipo":"fijo","precio":30}, '
            '{"tipo":"rango","min":50,"max":55} o '
            '{"tipo":"hora","precio":50,"minimoMin":120}'
        ),
    )
    buffer_minutos = fields.Integer(string='Buffer (minutos)', default=0)
    trabajador_ids = fields.Many2many(
        'lepetitcan.trabajador',
        'lepetitcan_servicio_trabajador_rel',
        'servicio_id',
        'trabajador_id',
        string='Trabajadores habilitados',
    )
    active = fields.Boolean(string='Activo', default=True)