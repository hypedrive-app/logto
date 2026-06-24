/* init_order = 1 */

create table resources (
  tenant_id varchar(21) not null
    references tenants (id) on update cascade on delete cascade,
  id varchar(21) not null,
  name text not null,
  indicator text not null, /* resource indicator also used as audience */
  is_default boolean not null default (false),
  access_token_ttl bigint not null default(3600), /* expiration value in seconds, default is 1h */
  /** Step-up: default minimum ACR for this resource's scopes that leave `required_acr` null. Null means no resource default, so fall back to app default, then org override. See `LogtoAcrValues`. */
  default_acr varchar(64),
  primary key (id),
  constraint resources__indicator
    unique (tenant_id, indicator)
);

create index resources__id
  on resources (tenant_id, id);

create unique index resources__is_default_true
  on resources (tenant_id)
  where is_default = true;
