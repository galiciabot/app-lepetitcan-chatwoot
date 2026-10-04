# -*- coding: utf-8 -*-
from odoo import fields, models


class CalendarEvent(models.Model):
    _inherit = 'calendar.event'

    lpc_servicio_id = fields.Many2one(
        'lepetitcan.servicio', string='Servicio', index=True,
    )
    lpc_trabajador_id = fields.Many2one(
        'lepetitcan.trabajador', string='Trabajador', index=True,
    )
    lpc_mascota_id = fields.Many2one(
        'res.partner', string='Mascota', index=True,
    )
    lpc_estado = fields.Selection(
        [
            ('pendiente', 'Pendiente'),
            ('confirmada', 'Confirmada'),
            ('en_camino', 'En Camino'),
            ('en_proceso', 'En Proceso'),
            ('finalizada', 'Finalizada'),
            ('anulada', 'Anulada'),
        ],
        string='Estado',
        default='pendiente',
        index=True,
    )
    lpc_duracion_total_min = fields.Integer(string='Duración total (min)')