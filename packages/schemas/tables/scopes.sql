/* init_order = 2 */

create table scopes (
  tenant_id varchar(21) not null
    references tenants (id) on update cascade on delete cascade,
  id varchar(21) not null,
  resource_id varchar(21) not null
    references resources (id) on update cascade on delete cascade,
  name varchar(256) not null,
  description text,
  /** Step-up: minimum ACR required before this scope may be granted into a token. Null means inherit the resource default, then app default, then org override. See `LogtoAcrValues`. */
  required_acr varchar(64),
  created_at timestamptz not null default(now()),
  primary key (id),
  constraint scopes__resource_id_name
    unique (tenant_id, resource_id, name)
);

create index scopes__id
  on scopes (tenant_id, id);
