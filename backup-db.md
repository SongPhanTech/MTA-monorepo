# Backup db

## Backup/restore data only to sql file

### backup to sql

```bash
pg_dump \
  -U admin \
  -h 113.192.17.90 \
  -d mta \
  --data-only \
  --disable-triggers \
  > data_only_backup.sql
```

### restore from sql

```bash
psql -U admin -h 113.192.17.90 -d mta < data_only_backup.sql
```

## Backup/Restore custom format

### backup custom

```bash
pg_dump -U admin -h 113.192.17.90 -d mta --schema=tro-ly-ao -Fc -a > data_tro_ly_ao.custom
```

### restore custom

```bash
pg_restore -U admin -h 113.192.17.90 -d mta --disable-triggers -a -j 4 data_dump.custom
```

## Backup/Restore custom format filter schema

### backup filter schema

```bash
pg_dump -U admin -h 113.192.17.90 -d mta --schema="mta|he-thong|ql-danh-muc|tro-ly-ao"  -Fc -a > categories.custom
```

### restore filter schema

```bash
pg_restore -U admin -h 113.192.17.90 -d mta --disable-triggers -a -j 4 categories.custom
```
