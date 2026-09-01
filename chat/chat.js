// FutbolX Chat Engine
// Extracted from live.html without changing chat behavior.
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
    import { SB_URL, SB_KEY } from "./config.js";
    import { EMOTE_LIBRARY } from "./emotes.js";

    const supabase = createClient(SB_URL, SB_KEY);
    window.globalSupabaseInstance = supabase;

    const eventID = window.CHAT_EVENT_ID || window.location.pathname.split('/').pop() || 'lobby';

    let currentUser = localStorage.getItem('chat_user');
    let currentIP = "127.0.0.1";
    let isOwner = false;
    let isMod = false;
    let isMuted = false;
    let isChatClosedGlobal = false;
    let slowModeSeconds = 0;
    let lastSentTimestamp = 0;
    let cooldownTimer = null;
    let replyTo = null;
    let currentPinnedMessageId = null;
    let allMembersCache = [];

    const BAD_WORDS = [
      "nigger", "nigga", "faggot", "retard", "kyf", "kys", 
      "cunt", "whore", "slut", "chink", "spic"
    ];


    async function initChat() {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        currentIP = data.ip;
      } catch (e) {}

      if (currentUser) {
        await verifyUserProfile();
      }

      setupEmotePicker();
      setupInputListeners();
      await fetchRoomSettings();
      await fetchMessages();
      subscribeRealtime();
      if (typeof window.initViewerPresenceEngine === 'function') {
        window.initViewerPresenceEngine();
      }
      refreshInputUI();
    }

    async function verifyUserProfile() {
      const { data } = await supabase.from('profiles').select('*').eq('username', currentUser).maybeSingle();
      if (data) {
        isOwner = !!data.is_owner;
        isMod = !!data.is_mod;
        isMuted = !!data.is_muted;
      }
      const adminBtn = document.getElementById('openAdminDashboardBtn');
      if (isOwner || isMod) {
        if (adminBtn) adminBtn.classList.remove('d-none');
        document.querySelectorAll('.owner-only-tab').forEach(el => {
          if (isOwner) el.classList.remove('d-none');
          else el.classList.add('d-none');
        });
      } else {
        if (adminBtn) adminBtn.classList.add('d-none');
      }
    }

    async function fetchRoomSettings() {
      const { data } = await supabase.from('room_settings').select('*').eq('event_id', eventID).maybeSingle();
      if (data) {
        isChatClosedGlobal = !!data.is_closed;
        slowModeSeconds = data.slow_mode || 0;
        
        const slowNotice = document.getElementById('slowModeNotice');
        if (slowNotice) {
          if (slowModeSeconds > 0) slowNotice.classList.remove('d-none');
          else slowNotice.classList.add('d-none');
        }

        const slowSelect = document.getElementById('slowModeSelect');
        if (slowSelect) slowSelect.value = slowModeSeconds.toString();

        if (data.announcement) {
          showAnnouncementUI(data.announcement);
        } else {
          hideAnnouncementUI();
        }
        if (data.pinned_message_id) {
          currentPinnedMessageId = data.pinned_message_id;
          loadPinnedMessage(data.pinned_message_id);
        } else {
          hidePinnedUI();
        }
      } else {
        hideAnnouncementUI();
        hidePinnedUI();
      }
      updateChatLockBtnUI();
    }

    function refreshInputUI() {
      const activeRow = document.getElementById('activeInputRow');
      const metaRow = document.getElementById('chatMetaRow');
      const regRow = document.getElementById('usernameRegisterRow');
      const mutedBanner = document.getElementById('mutedBanner');
      const closedBanner = document.getElementById('closedBanner');

      if (activeRow) activeRow.classList.add('d-none');
      if (metaRow) metaRow.classList.add('d-none');
      if (regRow) regRow.classList.add('d-none');
      if (mutedBanner) mutedBanner.classList.add('d-none');
      if (closedBanner) closedBanner.classList.add('d-none');

      if (!currentUser) {
        if (regRow) regRow.classList.remove('d-none');
      } else if (isMuted) {
        if (mutedBanner) mutedBanner.classList.remove('d-none');
      } else if (isChatClosedGlobal && !isOwner && !isMod) {
        if (closedBanner) closedBanner.classList.remove('d-none');
      } else {
        if (activeRow) activeRow.classList.remove('d-none');
        if (metaRow) metaRow.classList.remove('d-none');
      }
    }

    window.registerGuestUser = async () => {
      const inputVal = document.getElementById('guestUsername').value.trim();
      if (!inputVal) return alert("Please enter a username");

      const { data: existing } = await supabase.from('profiles').select('username').eq('device_ip', currentIP);
      if (existing && existing.length >= 3 && inputVal.toLowerCase() !== 'futbolx') {
        return alert("Limit reached: 3 accounts per IP.");
      }

      const isFut = inputVal.toLowerCase() === 'futbolx';
      const cleanName = isFut ? 'Futbolx' : inputVal;

      const { error } = await supabase.from('profiles').upsert([
        { username: cleanName, device_ip: currentIP, is_owner: isFut }
      ], { onConflict: 'username' });

      if (error) {
        alert("Username taken or unavailable.");
      } else {
        localStorage.setItem('chat_user', cleanName);
        currentUser = cleanName;
        await verifyUserProfile();
        refreshInputUI();
      }
    };

    async function fetchMessages() {
      const { data } = await supabase.from('messages')
        .select('*')
        .eq('event_id', eventID)
        .order('created_at', { ascending: true })
        .limit(100);

      const box = document.getElementById('futbolx-chat-messages');
      if (box) {
        box.innerHTML = '';
        if (data) data.forEach(renderSingleMessage);
      }
    }

    function checkAutoMod(text) {
      const lower = text.toLowerCase();
      return BAD_WORDS.some(word => lower.includes(word));
    }

    function renderSingleMessage(msg) {
      const box = document.getElementById('futbolx-chat-messages');
      if (!box) return;

      const div = document.createElement('div');
      div.className = 'msg-row';
      div.id = `msg-${msg.id}`;

      let content = escapeHTML(msg.message || "");

      EMOTE_LIBRARY.forEach(e => {
        const regex = new RegExp(`:${e.name}:`, 'g');
        content = content.replace(regex, `<img src="${e.url}" class="chat-emote" alt="${e.name}">`);
      });

      const mentionRegex = /@([a-zA-Z0-9_]+)/g;
      content = content.replace(mentionRegex, (match, username) => {
        const isMe = currentUser && username.toLowerCase() === currentUser.toLowerCase();
        const isFutOwner = username.toLowerCase() === 'futbolx';
        
        let tagClass = 'chat-mention';
        if (isMe) {
          tagClass += ' me';
        } else if (isFutOwner) {
          tagClass += ' owner-tag';
        }
        
        return `<span class="${tagClass}">@${username}</span>`;
      });

      let replyHTML = '';
      if (msg.reply_to_username) {
        replyHTML = `<div class="reply-context" onclick="scrollToMsg('${msg.reply_to_id}')">
          <i class="fas fa-reply me-1"></i>@${escapeHTML(msg.reply_to_username)}: ${escapeHTML(msg.reply_to_msg?.substring(0,30) || "")}...
        </div>`;
      }

      let authorClass = 'user';
      let badgeHTML = '';

      if (msg.is_owner || msg.username?.toLowerCase() === 'futbolx') {
        authorClass = 'owner';
        badgeHTML = `<i class="fas fa-crown badge-owner" title="Owner"></i>`;
      } else if (msg.is_mod) {
        authorClass = 'mod';
        badgeHTML = `<span class="user-badge badge-mod">MOD</span>`;
      }

      let actionsHTML = '';
      if (currentUser) {
        let pinIcon = (isOwner || isMod) ? `<i class="fas fa-thumbtack action-icon" title="Pin" onclick="pinMessage('${msg.id}')"></i>` : '';
        let delIcon = (isOwner || isMod || msg.username === currentUser) ? `<i class="fas fa-trash action-icon danger" title="Delete" onclick="deleteMessage('${msg.id}')"></i>` : '';
        actionsHTML = `<div class="msg-hover-actions">
          <i class="fas fa-reply action-icon" title="Reply" onclick="setReplyTarget('${msg.id}', '${escapeHTML(msg.username)}', '${escapeHTML(msg.message)}')"></i>
          ${pinIcon}
          ${delIcon}
        </div>`;
      }

      div.innerHTML = `${replyHTML}<div>${badgeHTML}<span class="chat-author ${authorClass}" onclick="mentionUser('${escapeHTML(msg.username)}')">${escapeHTML(msg.username)}</span>: <span class="msg-text">${content}</span></div>${actionsHTML}`;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }

    window.mentionUser = (username) => {
      const input = document.getElementById('chatInput');
      if (input) {
        input.value += `@${username} `;
        input.focus();
        input.dispatchEvent(new Event('input'));
      }
    };

    function setupInputListeners() {
      const input = document.getElementById('chatInput');
      const counter = document.getElementById('charCounter');

      if (input && counter) {
        input.addEventListener('input', () => {
          counter.textContent = `${input.value.length}/250`;
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        });
      }

      const sendBtn = document.getElementById('sendChatBtn');
      if (sendBtn) sendBtn.onclick = sendMessage;

      const emoteBtn = document.getElementById('emoteToggleBtn');
      if (emoteBtn) {
        emoteBtn.onclick = () => {
          document.getElementById('emotePickerPopover')?.classList.toggle('d-none');
        };
      }
    }

    async function sendMessage() {
      if (!currentUser || isMuted) return;
      if (isChatClosedGlobal && !isOwner && !isMod) return;

      const input = document.getElementById('chatInput');
      if (!input) return;

      const text = input.value.trim();
      if (!text) return;

      if (checkAutoMod(text)) {
        alert("Your message contained inappropriate words and was automatically blocked.");
        input.value = '';
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      if (slowModeSeconds > 0 && !isOwner && !isMod) {
        const timePassed = now - lastSentTimestamp;
        if (timePassed < slowModeSeconds) {
          const remaining = slowModeSeconds - timePassed;
          startCooldownUI(remaining);
          return;
        }
      }

      input.value = '';
      const counter = document.getElementById('charCounter');
      if (counter) counter.textContent = '0/250';

      lastSentTimestamp = now;

      if (slowModeSeconds > 0 && !isOwner && !isMod) {
        startCooldownUI(slowModeSeconds);
      }

      await supabase.from('messages').insert([{
        username: currentUser,
        message: text,
        event_id: eventID,
        is_owner: isOwner,
        is_mod: isMod,
        reply_to_username: replyTo?.username,
        reply_to_msg: replyTo?.msg,
        reply_to_id: replyTo?.id
      }]);

      cancelReply();
    }

    function startCooldownUI(seconds) {
      const sendBtn = document.getElementById('sendChatBtn');
      if (!sendBtn) return;

      sendBtn.disabled = true;
      let left = seconds;

      clearInterval(cooldownTimer);
      cooldownTimer = setInterval(() => {
        left--;
        if (left <= 0) {
          clearInterval(cooldownTimer);
          sendBtn.disabled = false;
        }
      }, 1000);
    }

    window.setReplyTarget = (id, username, msg) => {
      replyTo = { id, username, msg };
      const preview = document.getElementById('replyPreview');
      const textNode = document.getElementById('replyText');
      if (preview) preview.classList.remove('d-none');
      if (textNode) textNode.textContent = `Replying to @${username}`;
      const input = document.getElementById('chatInput');
      if (input) input.focus();
    };

    window.cancelReply = () => {
      replyTo = null;
      const preview = document.getElementById('replyPreview');
      if (preview) preview.classList.add('d-none');
    };

    function setupEmotePicker() {
      const grid = document.getElementById('emoteGrid');
      if (!grid) return;
      grid.innerHTML = '';
      EMOTE_LIBRARY.forEach(e => {
        const item = document.createElement('div');
        item.className = 'emote-item';
        item.innerHTML = `<img src="${e.url}" title="${e.name}">`;
        item.onclick = () => {
          const input = document.getElementById('chatInput');
          if (input) {
            input.value += ` :${e.name}: `;
            input.dispatchEvent(new Event('input'));
          }
          document.getElementById('emotePickerPopover')?.classList.add('d-none');
        };
        grid.appendChild(item);
      });
    }

    window.deleteMessage = async (id) => {
      await supabase.from('messages').delete().eq('id', id);
    };

    window.pinMessage = async (id) => {
      if (!isOwner && !isMod) return;
      await supabase.from('room_settings').upsert([{ event_id: eventID, pinned_message_id: id }], { onConflict: 'event_id' });
    };

    window.unpinMessage = async () => {
      if (!isOwner && !isMod) return;
      await supabase.from('room_settings').upsert([{ event_id: eventID, pinned_message_id: null }], { onConflict: 'event_id' });
      hidePinnedUI();
    };

    async function loadPinnedMessage(id) {
      const { data } = await supabase.from('messages').select('*').eq('id', id).maybeSingle();
      if (data) {
        const pContainer = document.getElementById('pinnedMessageContainer');
        const pContent = document.getElementById('pinnedContent');
        const unpinBtn = document.getElementById('unpinBtn');
        if (pContainer) pContainer.classList.remove('d-none');
        if (pContent) pContent.textContent = `@${data.username}: ${data.message}`;
        if (unpinBtn) {
          if (isOwner || isMod) unpinBtn.classList.remove('d-none');
          else unpinBtn.classList.add('d-none');
        }
      } else {
        hidePinnedUI();
      }
    }

    function hidePinnedUI() {
      const pContainer = document.getElementById('pinnedMessageContainer');
      if (pContainer) pContainer.classList.add('d-none');
    }

    function showAnnouncementUI(text) {
      const aContainer = document.getElementById('announcementContainer');
      const aText = document.getElementById('announcementText');
      const dBtn = document.getElementById('dismissAnnounceBtn');
      if (aContainer) aContainer.classList.remove('d-none');
      if (aText) aText.textContent = text;
      if (dBtn) {
        if (isOwner) dBtn.classList.remove('d-none');
        else dBtn.classList.add('d-none');
      }
    }

    function hideAnnouncementUI() {
      const aContainer = document.getElementById('announcementContainer');
      if (aContainer) aContainer.classList.add('d-none');
    }

    window.publishAnnouncement = async () => {
      if (!isOwner) return;
      const input = document.getElementById('announcementInput');
      if (!input) return;
      const text = input.value.trim();
      await supabase.from('room_settings').upsert([{ event_id: eventID, announcement: text }], { onConflict: 'event_id' });
    };

    window.dismissAnnouncement = async () => {
      if (!isOwner) return;
      await supabase.from('room_settings').upsert([{ event_id: eventID, announcement: null }], { onConflict: 'event_id' });
      hideAnnouncementUI();
    };

    window.saveSlowModeSetting = async () => {
      if (!isOwner && !isMod) return;
      const select = document.getElementById('slowModeSelect');
      const val = parseInt(select.value, 10);
      await supabase.from('room_settings').upsert([{ event_id: eventID, slow_mode: val }], { onConflict: 'event_id' });
      alert(`Slow mode set to ${val} seconds.`);
    };

    window.toggleChatClosedState = async () => {
      if (!isOwner && !isMod) return;
      await supabase.from('room_settings').upsert([{ event_id: eventID, is_closed: !isChatClosedGlobal }], { onConflict: 'event_id' });
    };

    function updateChatLockBtnUI() {
      const btn = document.getElementById('toggleChatClosedBtn');
      if (btn) {
        btn.textContent = isChatClosedGlobal ? "Unlock Chat" : "Lock Chat";
        btn.className = `btn btn-sm ${isChatClosedGlobal ? 'btn-success' : 'btn-warning'}`;
      }
    }

    window.clearAllChat = async () => {
      if (!isOwner && !isMod) return;
      if (confirm("Clear all messages in this room?")) {
        await supabase.from('messages').delete().eq('event_id', eventID);
      }
    };

    const adminModal = document.getElementById('adminDashboardModal');
    if (adminModal) {
      adminModal.addEventListener('show.bs.modal', loadMembersForAdmin);
    }
    
    document.getElementById('memberSearchInput')?.addEventListener('input', (e) => {
      renderMemberList(e.target.value);
    });

    async function loadMembersForAdmin() {
      const { data } = await supabase.from('profiles').select('*');
      if (data) {
        allMembersCache = data;
        renderMemberList();
      }
    }

    function renderMemberList(filter = "") {
      const list = document.getElementById('adminMemberList');
      if (!list) return;
      list.innerHTML = "";
      const q = filter.toLowerCase();

      allMembersCache
        .filter(m => m.username?.toLowerCase().includes(q) || m.device_ip?.includes(q))
        .forEach(m => {
          const item = document.createElement('div');
          item.className = 'list-group-item list-group-item-action bg-dark text-white border-secondary d-flex justify-content-between align-items-center member-item-row';
          
          let role = m.is_owner ? 'Owner' : (m.is_mod ? 'Mod' : 'User');
          let muted = m.is_muted ? ' (Muted)' : '';
          
          item.innerHTML = `<div>
            <strong class="${m.is_owner ? 'text-fx-accent' : (m.is_mod ? 'text-warning' : 'text-info')}">${escapeHTML(m.username)}</strong>
            <small class="text-muted ms-2">${role}${muted} - ${m.device_ip || 'No IP'}</small>
          </div>`;
          item.onclick = () => openMemberActions(m.username);
          list.appendChild(item);
        });
    }

    window.openMemberActions = async (targetUsername) => {
      if (!isOwner && !isMod) return;
      const { data: user } = await supabase.from('profiles').select('*').eq('username', targetUsername).maybeSingle();
      if (!user) return;

      const modalTitle = document.getElementById('actionModalUsername');
      if (modalTitle) modalTitle.textContent = user.username;

      const container = document.getElementById('memberActionButtons');
      if (!container) return;
      container.innerHTML = "";

      const muteBtn = document.createElement('button');
      muteBtn.className = `btn btn-sm ${user.is_muted ? 'btn-success' : 'btn-warning'} w-100`;
      muteBtn.textContent = user.is_muted ? 'Unmute User' : 'Mute User';
      muteBtn.onclick = async () => {
        await supabase.from('profiles').update({ is_muted: !user.is_muted }).eq('username', user.username);
        bootstrap.Modal.getInstance(document.getElementById('memberActionModal')).hide();
        loadMembersForAdmin();
      };
      container.appendChild(muteBtn);

      if (isOwner) {
        const modBtn = document.createElement('button');
        modBtn.className = `btn btn-sm ${user.is_mod ? 'btn-secondary' : 'btn-info'} w-100`;
        modBtn.textContent = user.is_mod ? 'Remove Mod' : 'Make Mod';
        modBtn.onclick = async () => {
          await supabase.from('profiles').update({ is_mod: !user.is_mod }).eq('username', user.username);
          bootstrap.Modal.getInstance(document.getElementById('memberActionModal')).hide();
          loadMembersForAdmin();
        };
        container.appendChild(modBtn);
      }

      new bootstrap.Modal(document.getElementById('memberActionModal')).show();
    };

    function subscribeRealtime() {
      supabase.channel('messages_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `event_id=eq.${eventID}` }, p => renderSingleMessage(p.new))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `event_id=eq.${eventID}` }, p => {
          document.getElementById(`msg-${p.old.id}`)?.remove();
        })
        .subscribe();

      supabase.channel('room_settings_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_settings', filter: `event_id=eq.${eventID}` }, () => fetchRoomSettings())
        .subscribe();

      if (currentUser) {
        supabase.channel('profile_updates')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `username=eq.${currentUser}` }, p => {
            isMuted = !!p.new.is_muted;
            isMod = !!p.new.is_mod;
            isOwner = !!p.new.is_owner;
            refreshInputUI();
          })
          .subscribe();
      }
    }

    window.scrollToMsg = (id) => {
      const el = document.getElementById(`msg-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.style.background = '#1f293d';
        setTimeout(() => { el.style.background = ''; }, 2000);
      }
    };

    function escapeHTML(str) {
      return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }

    // Loaded by chat/loader.js after the chat markup is mounted.
    initChat();
