-- Preenche first_responded_at quando houver primeira comunicação de saída com o lead.
create or replace function public.set_first_response_time()
returns trigger language plpgsql as $$
begin
  if new.lead_id is not null and new.direction = 'outbound' then
    update leads
      set first_responded_at = coalesce(first_responded_at, new.created_at)
      where id = new.lead_id;
  end if;
  return new;
end;
$$;

drop trigger if exists t_comm_set_first_response on public.communications;
create trigger t_comm_set_first_response
after insert on public.communications
for each row execute function public.set_first_response_time();
