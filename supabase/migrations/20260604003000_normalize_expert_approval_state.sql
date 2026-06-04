update public.experts
set
  approved = case
    when approval_status = 'approved' or status = 'approved' then true
    else false
  end,
  approval_status = case
    when approval_status in ('pending', 'approved', 'rejected') then approval_status
    when status in ('pending', 'approved', 'rejected') then status
    else 'pending'
  end,
  status = case
    when approval_status in ('pending', 'approved', 'rejected') then approval_status
    when status in ('pending', 'approved', 'rejected') then status
    else 'pending'
  end;

update public.experts
set approved = false
where approval_status <> 'approved';
