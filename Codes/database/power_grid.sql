/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     2019/6/21 14:17:43                           */
/*==============================================================*/


drop table if exists FRIENDS;

drop table if exists MEMBER;

drop table if exists ROOM;

drop table if exists USER;

/*==============================================================*/
/* Table: FRIENDS                                               */
/*==============================================================*/
create table FRIENDS
(
   user_name_1          char(20) not null,
   user_name_2          char(20) not null,
   primary key (user_name_1, user_name_2)
);

/*==============================================================*/
/* Table: MEMBER                                                */
/*==============================================================*/
create table MEMBER
(
   user_name            char(20) not null,
   room_id              bigint not null,
   primary key (user_name, room_id)
);

/*==============================================================*/
/* Table: ROOM                                                  */
/*==============================================================*/
create table ROOM
(
   room_id              bigint not null auto_increment,
   room_owner           char(20) not null,
   room_open            bool not null,
   room_memnum          int not null,
   primary key (room_id)
);

/*==============================================================*/
/* Table: USER                                                  */
/*==============================================================*/
create table USER
(
   user_name            char(20) not null,
   user_passwd          char(20) not null,
   primary key (user_name)
);

alter table FRIENDS add constraint FK_Reference_1 foreign key (user_name_1)
      references USER (user_name) on delete cascade on update cascade;

alter table FRIENDS add constraint FK_Reference_2 foreign key (user_name_2)
      references USER (user_name) on delete cascade on update cascade;

alter table MEMBER add constraint FK_Reference_3 foreign key (user_name)
      references USER (user_name) on delete cascade on update cascade;

alter table MEMBER add constraint FK_Reference_4 foreign key (room_id)
      references ROOM (room_id) on delete cascade on update cascade;

alter table ROOM add constraint FK_Reference_5 foreign key (room_owner)
      references USER (user_name) on delete cascade on update cascade;

