import React, { useEffect, useState } from "react";
 import axios from "axios";
import "../../styles/userList.css";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { Table, Button, Tag, Space } from "antd";
import { useNavigate } from "react-router-dom";
import {
  DeleteOutlined,
  StopOutlined,
  CheckOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";

const MySwal = withReactContent(Swal);

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 3;
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await  axios. get("/api/v1/admin/all-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdminToggle = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await  axios. put(
        `/api/v1/admin/toggle-admin/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User role updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleBlockToggle = async (id, isBlocked) => {
    try {
      const token = localStorage.getItem("token");
      const url = isBlocked
        ? `/api/v1/admin/unblock-user/${id}`
        : `/api/v1/admin/block-user/${id}`;
      await  axios. put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isBlocked ? "User unblocked" : "User blocked");
      fetchUsers();
    } catch (err) {
      toast.error("Action failed", err);
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await  axios. delete(`/api/v1/admin/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("User deleted successfully!");
      MySwal.fire("Deleted!", "User has been deleted.", "success");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Role",
      dataIndex: "isAdmin",
      key: "isAdmin",
      filters: [
        { text: "Admin", value: true },
        { text: "User", value: false },
      ],
      onFilter: (value, record) => record.isAdmin === value,
      render: (isAdmin) =>
        isAdmin ? <Tag color="green">Admin</Tag> : <Tag color="blue">User</Tag>,
    },
    {
      title: "Status",
      dataIndex: "isBlocked",
      key: "isBlocked",
      filters: [
        { text: "Active", value: false },
        { text: "Blocked", value: true },
      ],
      onFilter: (value, record) => record.isBlocked === value,
      render: (isBlocked) =>
        isBlocked ? <Tag color="red">Blocked</Tag> : <Tag color="green">Active</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            type={record.isBlocked ? "default" : "primary"}
            icon={record.isBlocked ? <CheckOutlined /> : <StopOutlined />}
            onClick={() => handleBlockToggle(record._id, record.isBlocked)}
            disabled={record.isAdmin}
          >
            {record.isBlocked ? "Unblock" : "Block"}
          </Button>

          <Button
            type={record.isAdmin ? "default" : "primary"}
            icon={record.isAdmin ? <UserDeleteOutlined /> : <UserAddOutlined />}
            onClick={() => handleAdminToggle(record._id)}
          >
            {record.isAdmin ? "User" : "Admin"}
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            disabled={record.isAdmin}
          >
            Delete
          </Button>

          <Button
            type="dashed"
            icon={<InfoCircleOutlined />}
            onClick={() => navigate(`/user/${record._id}`)}
          >
            Info
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-user-list">
      <h2 className="page-title">All Registered Users</h2>

      <div className="search-bar-wrapper">
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="custom-search-input"
        />
      </div>

      <Table
        columns={columns}
        dataSource={currentUsers}
        rowKey="_id"
        loading={loading}
        pagination={false}
        bordered
        className="user-table"
        scroll={{ x: "max-content" }}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
            )
            .map((page, i, arr) => {
              if (i > 0 && page - arr[i - 1] > 1) {
                return (
                  <React.Fragment key={page}>
                    <span className="dots">...</span>
                    <Button
                      type={currentPage === page ? "primary" : "default"}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                );
              }
              return (
                <Button
                  key={page}
                  type={currentPage === page ? "primary" : "default"}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}

          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;
