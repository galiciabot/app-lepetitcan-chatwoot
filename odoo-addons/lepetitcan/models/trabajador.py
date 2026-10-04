# -*- coding: utf-8 -*-
from odoo import fields, models


class LpcTrabajador(models.Model):
    _name = 'lepetitcan.trabajador'
    _description = 'Trabajador Le Petit Can'

    name = fields.Char(string='Nombre', required=True)
    horario_laboral = fields.Text(
        string='Horario laboral',
        help='JSON: {"lunes": ["09:00", "18:00"], "martes": [...]}',
    )
    servicio_ids = fields.Many2many(
        'lepetitcan.servicio',
        'lepetitcan_servicio_trabajador_rel',
        'trabajador_id',
        'servicio_id',
        string='Servicios habilitados',
    )
    active = fields.Boolean(string='Activo', default=True)