import json
import os
from app.core.config import settings


def get_ad_users():
    if settings.AD_MODE == 'mock':
        return _get_mock_users()
    else:
        return _get_real_ad_users()


def authenticate_ad_user(username: str, password: str) -> bool:
    if settings.AD_MODE == 'mock':
        return _mock_authenticate(username, password)
    else:
        return _real_ad_authenticate(username, password)


# ══ MOCK FUNCTIONS (for development without AD) ══

def _get_mock_users():
    mock_file = os.path.join(
        os.path.dirname(__file__), '..', 'mock_data', 'ad_users.json'
    )
    if not os.path.exists(mock_file):
        return []
    with open(mock_file, 'r') as f:
        users = json.load(f)
    return [{
        'username': u['username'], 'email': u['email'],
        'full_name': u['full_name'], 'department': u['department'],
        'designation': u['designation'], 'employee_id': u['employee_id'],
        'manager_dn': u.get('manager_username'),
    } for u in users]


def _mock_authenticate(username: str, password: str) -> bool:
    mock_file = os.path.join(
        os.path.dirname(__file__), '..', 'mock_data', 'ad_users.json'
    )
    if not os.path.exists(mock_file):
        return False
    with open(mock_file, 'r') as f:
        users = json.load(f)
    for u in users:
        if u['username'] == username and u['password'] == password:
            return True
    return False


# ══ REAL AD FUNCTIONS (for production) ══

def _get_real_ad_users():
    from ldap3 import Server, Connection, ALL, SUBTREE
    server = Server(settings.AD_SERVER, get_info=ALL)
    conn = Connection(server, user=settings.AD_BIND_USER,
                      password=settings.AD_BIND_PASSWORD, auto_bind=True)
    conn.search(
        search_base=settings.AD_BASE_DN,
        search_filter='(&(objectClass=user)(objectCategory=person))',
        search_scope=SUBTREE,
        attributes=['sAMAccountName', 'mail', 'displayName',
                    'department', 'title', 'manager', 'employeeID']
    )
    users = []
    for entry in conn.entries:
        users.append({
            'username': str(entry.sAMAccountName),
            'email': str(entry.mail) if entry.mail else None,
            'full_name': str(entry.displayName),
            'department': str(entry.department) if entry.department else None,
            'designation': str(entry.title) if entry.title else None,
            'employee_id': str(entry.employeeID) if entry.employeeID else None,
            'manager_dn': str(entry.manager) if entry.manager else None,
        })
    conn.unbind()
    return users


def _real_ad_authenticate(username: str, password: str) -> bool:
    try:
        from ldap3 import Server, Connection, ALL
        server = Server(settings.AD_SERVER, get_info=ALL)
        user_dn = f'{settings.AD_DOMAIN}\\{username}'
        conn = Connection(server, user=user_dn, password=password)
        return conn.bind()
    except Exception:
        return False
