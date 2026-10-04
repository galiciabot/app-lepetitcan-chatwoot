# -*- coding: utf-8 -*-
from odoo import fields, models


class LpcBloqueo(models.Model):
    _name = 'lepetitcan.bloqueo'
    _description = 'Bloqueo de agenda Le Petit Can'

    name = fields.Char(string='Título')
    fecha_inicio = fields.Date(string='Fecha inicio', required=True)
    fecha_fin = fields.Date(string='Fecha fin')
    hora_inicio = fields.Char(string='Hora inicio (HH:MM)')
    hora_fin = fields.Char(string='Hora fin (HH:MM)')
    trabajador_id = fields.Many2one(
        'lepetitcan.trabajador',
        string='Trabajador',
        help='Vacío = aplica a todos (feriado)',
        index=True,
    )