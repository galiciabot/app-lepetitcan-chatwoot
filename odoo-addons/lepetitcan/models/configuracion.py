# -*- coding: utf-8 -*-
from odoo import fields, models


class LpcConfiguracion(models.Model):
    _name = 'lepetitcan.configuracion'
    _description = 'Configuración Le Petit Can'

    name = fields.Char(string='Nombre', default='Configuración')
    horario_global = fields.Text(
        string='Horario global',
        help=(
            'JSON por día de la semana. Cada día es una lista de bloques '
            '["HH:MM","HH:MM"]; una lista vacía significa cerrado. '
            'Ej: {"lunes":[["09:00","13:00"],["15:00","18:00"]],"domingo":[]}'
        ),
    )