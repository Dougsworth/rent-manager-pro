-- Add bank details columns to profiles
alter table profiles
  add column bank_name text not null default '',
  add column bank_account_name text not null default '',
  add column bank_account_number text not null default '',
  add column bank_branch text not null default '';
