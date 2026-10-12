"""Read-only catalog DTOs. Independent of the window and future KiCad adapter."""
from sqlalchemy import select
from kicad_parts_manager.database.models import (
    Component, Category, Manufacturer, SpecMosfet, SpecDiode, EdaMapping,
    SimulationModel, ValidationRun, ValidationResult, Parameter, ParameterDefinition, Document, Source,
)


def catalog(session, inventory=None):
    categories = {c.id: c.path for c in session.scalars(select(Category))}
    manufacturers = {m.id: m.name for m in session.scalars(select(Manufacturer))}
    rows = []
    for c in session.scalars(select(Component).order_by(Component.id)):
        models = []
        for m in session.scalars(select(SimulationModel).where(SimulationModel.component_id == c.id)):
            run = session.scalar(select(ValidationRun).where(
                ValidationRun.simulation_model_id == m.id).order_by(ValidationRun.id.desc()).limit(1))
            passed = []
            if run and run.result == "PASS" and run.model_sha256 == m.sha256:
                passed = list(session.scalars(select(ValidationResult.test_name).where(
                    ValidationResult.validation_run_id == run.id, ValidationResult.status == "PASS")))
            models.append(dict(id=m.id, name=m.model_name, status=m.status.value,
                               model_class=m.model_class.value, simulator=m.simulator,
                               manufacturer_model=m.manufacturer_model, file=m.model_file, sha256=m.sha256,
                               passed=passed, compatibility=m.compatibility.value, source_url=m.source_url,
                               test_suite=run.test_suite_version if run else None))
        spec = session.get(SpecMosfet, c.id) or session.get(SpecDiode, c.id)
        values = {col.name: getattr(spec, col.name) for col in spec.__table__.columns
                  if col.name != "component_id"} if spec else {}
        parameters = []
        for p, d in session.execute(select(Parameter, ParameterDefinition).join(
                ParameterDefinition, Parameter.definition_id == ParameterDefinition.id).where(
                Parameter.component_id == c.id)):
            values[d.name] = p.value_si
            parameters.append(dict(name=d.name, value=p.value_si, unit=d.si_unit,
                                   conditions=p.conditions, source=p.source))
        mapping = session.get(EdaMapping, c.id)
        datasheet = session.scalar(select(Source.url).join(Document, Document.source_id == Source.id).where(
            Document.component_id == c.id, Document.kind == 'datasheet').order_by(Document.id.desc()).limit(1))
        # Reference fixtures are illustrative, even when old seeds marked generic=False.
        reference = c.description.startswith("Illustrative reference")
        kind = "reference" if reference and not c.generic else "generic" if c.generic else "manufacturer"
        rows.append(dict(id=c.id, name=c.mpn, category=categories[c.category_id],
                         manufacturer=manufacturers.get(c.manufacturer_id, ""), kind=kind,
                         description=c.description, values=values, parameters=parameters,
                         models=models, intrinsic=c.generic and categories[c.category_id].startswith("passive/"),
                         symbol=mapping.kicad_symbol if mapping else "",
                         footprint=mapping.kicad_footprint if mapping else None,
                         model3d=mapping.kicad_3d_model if mapping else None,
                         kicad_reference='kicad-parts-manager:' + (
                             'passive' if categories[c.category_id].startswith('passive/') else
                             'mosfet' if '/mosfet/' in categories[c.category_id] else
                             'bjt' if '/bjt/' in categories[c.category_id] else 'diode') + '/' + c.id,
                         placement_key=c.id, library='kicad-parts-manager', registered=None,
                         symbol_found=None, source_file='', datasheet=datasheet or ''))
    if inventory:
        installed = [{k:v for k,v in c.items() if k not in ('symbol_preview','footprint_preview')} for c in inventory['components']]
        symbols = {c['symbol']:c for c in installed if c['kind'] == 'library'}
        footprints = {c['footprint']:c['footprint_info'] for c in installed if c['kind'] == 'footprint'}
        for row in rows:
            row['symbol_found'] = row['symbol'] in symbols
            row['footprint_info'] = footprints.get(row['footprint'], dict(found=False,models=[]))
        rows.extend(installed)
    from .kicad.transistor_taxonomy import transistor_category
    from .kicad.taxonomy import passive_category, magnetic_category
    for row in rows:
        if row['kind'] in ('generic','footprint') or row.get('import_category_override'):continue
        path=transistor_category(row.get('library',''),row.get('name',''),row.get('description',''),row['category']) or magnetic_category(row.get('library',''),row.get('name',''),row.get('description',''),row['category']) or passive_category(row.get('library',''),row.get('name',''),row.get('description',''),row['category'])
        if path:row['category']=path
    return dict(schema_version=1, components=rows,
                categories=sorted(set(categories.values()) | {c['category'] for c in rows}),
                inventory={k:v for k,v in inventory.items() if k not in ('components','categories','previews','source_stamps','cache_context','cache_version')} if inventory else None)
